/**
 * Tupaia
 * Copyright (c) 2017 - 2020 Beyond Essential Systems Pty Ltd
 */
import { reduceToDictionary } from '@tupaia/utils';
import { ORG_UNIT_ENTITY_TYPES } from '../modelClasses/Entity';

const REBUILD_DEBOUNCE_TIME = 1000; // wait 1 second after changes before rebuilding, to avoid double-up

export class EntityHierarchyCacher {
  constructor(models) {
    this.models = models;
    this.changeHandlerCancellers = [];
    this.scheduledRebuildJobs = [];
    this.scheduledRebuildTimeout = null;
  }

  listenForChanges() {
    this.changeHandlerCancellers[0] = this.models.entity.addChangeHandler(this.handleEntityChange);
    this.changeHandlerCancellers[1] = this.models.entityRelation.addChangeHandler(
      this.handleEntityRelationChange,
    );
  }

  stopListeningForChanges() {
    this.changeHandlerCancellers.forEach(c => c());
    this.changeHandlerCancellers = [];
  }

  handleEntityChange = async ({ record_id: entityId }) => {
    // if entity was deleted or created, or parent_id has changed, we need to delete subtrees and
    // rebuild all hierarchies
    const hierarchies = await this.models.entityHierarchy.all();
    const hierarchyTasks = hierarchies.map(async ({ id: hierarchyId }) => {
      await this.deleteSubtree(hierarchyId, entityId);
      return this.scheduleHierarchyForRebuild(hierarchyId);
    });
    await Promise.all(hierarchyTasks);
  };

  handleEntityRelationChange = async ({ old_record: oldRecord, new_record: newRecord }) => {
    // delete and rebuild subtree from both old and new record, in case hierarchy and/or parent_id
    // have changed
    const tasks = [oldRecord, newRecord]
      .filter(r => r)
      .map(r => this.deleteAndRebuildFromEntityRelation(r));
    return Promise.all(tasks);
  };

  deleteAndRebuildFromEntityRelation = async ({
    entity_hierarchy_id: hierarchyId,
    parent_id: parentId,
  }) => {
    await this.deleteSubtree(hierarchyId, parentId);
    return this.scheduleHierarchyForRebuild(hierarchyId);
  };

  // add the hierarchy to the list to be rebuilt, with a debounce so that we don't rebuild
  // many times for a bulk lot of changes
  scheduleHierarchyForRebuild(hierarchyId) {
    console.log('Scheduling', hierarchyId);
    const promiseForJob = new Promise(resolve => {
      this.scheduledRebuildJobs.push({ hierarchyId, resolve });
    });

    // clear any previous scheduled rebuild, so that we debounce all changes in the same time period
    if (this.scheduledRebuildTimeout) {
      clearTimeout(this.scheduledRebuildTimeout);
    }

    // schedule the rebuild to happen after an adequate period of debouncing
    this.scheduledRebuildTimeout = setTimeout(this.runScheduledRebuild, REBUILD_DEBOUNCE_TIME);

    // return the promise for the caller to await
    return promiseForJob;
  }

  runScheduledRebuild = async () => {
    // remove timeout so any jobs added now get scheduled anew
    this.scheduledRebuildTimeout = null;

    // retrieve the current set of jobs
    const jobs = this.scheduledRebuildJobs;
    this.scheduledRebuildJobs = [];

    // get the unique set of hierarchies to be rebuilt
    const hierarchiesForRebuild = [...new Set(jobs.map(j => j.hierarchyId))];

    // run rebuild
    const s = Date.now();
    console.log(
      `Running ${jobs.length} jobs, making up ${hierarchiesForRebuild.length} hierarchies`,
    );
    await this.buildAndCacheHierarchies(hierarchiesForRebuild);
    console.log(`Finished running ${jobs.length} jobs in ${(Date.now() - s) / 1000} seconds`);

    // resolve all jobs
    jobs.forEach(j => j.resolve());
  };

  async deleteSubtree(hierarchyId, rootEntityId) {
    const descendantRelations = await this.models.ancestorDescendantRelation.find({
      ancestor_id: rootEntityId,
      entity_hierarchy_id: hierarchyId,
    });
    const entityIdsForDelete = [rootEntityId, ...descendantRelations.map(r => r.descendant_id)];
    await this.models.database.executeSqlInBatches(entityIdsForDelete, batchOfEntityIds => [
      `
        DELETE FROM ancestor_descendant_relation
        WHERE
          entity_hierarchy_id = ?
        AND
          descendant_id IN (${batchOfEntityIds.map(() => '?').join(',')});
      `,
      [hierarchyId, ...batchOfEntityIds],
    ]);
  }

  /**
   * @param {[string[]]} hierarchyIds The specific hierarchies to cache (defaults to all)
   */
  async buildAndCacheHierarchies(hierarchyIds) {
    // TODO remove temporary debug logs after smoke testing
    const start = Date.now();
    console.log(`Building ${hierarchyIds ? hierarchyIds.length : 'all'} hierarchies`);
    // projects are the root entities of every full tree, so start with them
    const projectCriteria = hierarchyIds ? { entity_hierarchy_id: hierarchyIds } : {};
    const projects = await this.models.project.find(projectCriteria);
    const projectTasks = projects.map(async project => this.buildAndCacheProject(project));
    await Promise.all(projectTasks);
    console.log(
      `Finished building ${hierarchyIds ? hierarchyIds.length : 'all'} hierarchies in ${
        (Date.now() - start) / 1000
      } seconds`,
    );
  }

  async buildAndCacheProject(project) {
    const { entity_id: projectEntityId, entity_hierarchy_id: hierarchyId } = project;
    return this.fetchAndCacheDescendants(hierarchyId, { [projectEntityId]: [] });
  }

  /**
   * Recursively traverse the alternative hierarchy that begins with the specified parents.
   * At each generation, choose children via 'entity_relation' if any exist, or the canonical
   * entity.parent_id if none do
   * @param {string} hierarchyId             The specific hierarchy to follow through entity_relation
   * @param {string} parentIdsToAncestorIds  Keys are parent ids to fetch descendants of, values are
   *                                         all ancestor ids above each parent
   */
  async fetchAndCacheDescendants(hierarchyId, parentIdsToAncestorIds) {
    const parentIds = Object.keys(parentIdsToAncestorIds);

    // check whether next generation uses entity relation links, or should fall back to parent_id
    const entityRelationChildCount = await this.countEntityRelationChildren(hierarchyId, parentIds);
    const useEntityRelationLinks = entityRelationChildCount > 0;
    const childCount = useEntityRelationLinks
      ? entityRelationChildCount
      : await this.countCanonicalChildren(parentIds);

    if (childCount === 0) {
      return; // at a leaf node generation, no need to go any further
    }

    const childIdToAncestorIds = await this.fetchChildIdToAncestorIds(
      hierarchyId,
      parentIdsToAncestorIds,
      useEntityRelationLinks,
    );

    await this.cacheGeneration(hierarchyId, childIdToAncestorIds);

    // if there is another generation, keep recursing through the hierarchy
    await this.fetchAndCacheDescendants(hierarchyId, childIdToAncestorIds);
  }

  async fetchChildIdToAncestorIds(hierarchyId, parentIdsToAncestorIds, useEntityRelationLinks) {
    const parentIds = Object.keys(parentIdsToAncestorIds);
    const relations = useEntityRelationLinks
      ? await this.getRelationsViaEntityRelation(hierarchyId, parentIds)
      : await this.getRelationsCanonically(parentIds);
    const childIdToParentId = reduceToDictionary(relations, 'child_id', 'parent_id');
    const childIdToAncestorIds = Object.fromEntries(
      Object.entries(childIdToParentId).map(([childId, parentId]) => [
        childId,
        [parentId, ...parentIdsToAncestorIds[parentId]],
      ]),
    );
    return childIdToAncestorIds;
  }

  getEntityRelationChildrenCriteria(hierarchyId, parentIds) {
    return {
      parent_id: parentIds,
      entity_hierarchy_id: hierarchyId,
    };
  }

  async countEntityRelationChildren(hierarchyId, parentIds) {
    const criteria = this.getEntityRelationChildrenCriteria(hierarchyId, parentIds);
    return this.models.entityRelation.count(criteria);
  }

  async getRelationsViaEntityRelation(hierarchyId, parentIds) {
    // get any matching alternative hierarchy relationships leading out of these parents
    const criteria = this.getEntityRelationChildrenCriteria(hierarchyId, parentIds);
    return this.models.entityRelation.find(criteria);
  }

  getCanonicalChildrenCriteria(parentIds) {
    const canonicalTypes = Object.values(ORG_UNIT_ENTITY_TYPES);
    return {
      parent_id: parentIds,
      type: canonicalTypes,
    };
  }

  async countCanonicalChildren(parentIds) {
    const criteria = this.getCanonicalChildrenCriteria(parentIds);
    return this.models.entity.count(criteria);
  }

  async getRelationsCanonically(parentIds) {
    const criteria = this.getCanonicalChildrenCriteria(parentIds);
    const children = await this.models.entity.find(criteria, { columns: ['id', 'parent_id'] });
    return children.map(c => ({ child_id: c.id, parent_id: c.parent_id }));
  }

  /**
   * Stores the generation of ancestor/descendant info in the database
   * @param {string} hierarchyId
   * @param {Entity[]} childIdToAncestorIds   Ids of the child entities as keys, with the ids of their
   *                                          ancestors in order of generational distance, with immediate
   *                                          parent at index 0
   */
  async cacheGeneration(hierarchyId, childIdToAncestorIds) {
    const records = [];
    const childIds = Object.keys(childIdToAncestorIds);
    const existingParentRelations = await this.models.ancestorDescendantRelation.find({
      descendant_id: childIds,
      entity_hierarchy_id: hierarchyId,
      generational_distance: 1,
    });
    const childrenAlreadyCached = new Set(existingParentRelations.map(r => r.descendant_id));
    Object.entries(childIdToAncestorIds)
      .filter(([childId]) => !childrenAlreadyCached.has(childId))
      .forEach(([childId, ancestorIds]) => {
        ancestorIds.forEach((ancestorId, ancestorIndex) =>
          records.push({
            entity_hierarchy_id: hierarchyId,
            ancestor_id: ancestorId,
            descendant_id: childId,
            generational_distance: ancestorIndex + 1,
          }),
        );
      });
    await this.models.ancestorDescendantRelation.createMany(records);
  }
}
