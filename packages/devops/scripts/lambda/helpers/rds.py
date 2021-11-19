import boto3

resource_group_tagging_api = boto3.client('resourcegroupstaggingapi')
rds = boto3.client('rds')

def get_latest_db_snapshot(source_db_id):
    snapshots_response = rds.describe_db_snapshots(
        DBInstanceIdentifier=source_db_id
    )

    if 'DBSnapshots' not in snapshots_response or len(snapshots_response['Snapshots']) == 0:
        raise Exception('No snapshots found')

    latest_snapshot_id = sorted(snapshots_response['DBSnapshots'], key=lambda k: k['SnapshotCreateTime'], reverse=True)[0]['DBSnapshotIdentifier']
    print('Found snapshot with id ' + latest_snapshot_id)
    return latest_snapshot_id
          
def get_db_id(db_name):
    tagged_resources_response = resource_group_tagging_api.get_resources(
        TagFilters=[
            {
                'Key': 'Tag:DeploymentName',
                'Values': [db_name]
            }
        ],
        ResourceTypeFilters=[
            'rds:db',
        ]
    )

    if 'ResourceTagMappingList' not in tagged_resources_response or len(tagged_resources_response['ResourceTagMappingList']) == 0:
        raise Exception('No RDS db found with name' + db_name)
    
    if len(tagged_resources_response['ResourceTagMappingList']) > 1:
        raise Exception('Multiple RDS dbs found with name' + db_name)

    db_id = tagged_resources_response['ResourceTagMappingList'][0]['ResourceARN']
    print('Found db with id ' + db_id)
    return db_id



def create_db_instance_from_snapshot(
  instance_name,
  db_name,
  instance_type
):
    db_id = get_db_id(db_name)
    snapshot_id = get_latest_db_snapshot(db_id)
    print('Starting to clone db instance from snapshot')
    new_instance = rds.restore_db_instance_from_db_snapshot(
        DBInstanceIdentifier=instance_name,
        DBSnapshotIdentifier=snapshot_id,
        DBInstanceClass=instance_type,
        Port=5432, # Need to ensure this is handled by env vars
        PubliclyAccessible=True,
        VpcSecurityGroupIds=['vpc-4cb80b28']
    )
    print('Successfully cloned new db instance from snapshot')

    return new_instance