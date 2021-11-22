# Creates a new RDS instance with an installed Tupaia database cloned from an existing snapshot
#
#
# Spin up a new feature branch deployment of Tupaia, that will be deleted after 8 hours
# {
#   "Action": "spin_up_rds_instance",
#   "User": "rohan",
#   "Snapshot": "production"
# }

from helpers.rds import create_db_instance_from_snapshot

def spin_up_rds_deployment(event):
    # validate input config
    if 'DeploymentName' not in event:
        raise Exception('You must include the key "DeploymentName" in the lambda config, e.g. "dev".')
    deployment_name = event['DeploymentName']
    
    # get manual input parameters, or default for any not provided
    instance_type = event.get('InstanceType', 't4g.medium')
    security_group_code = event.get('SecurityGroupCode', 'tupaia-dev-sg') # Use security group tagged with code
    snapshot = event.get('Snapshot', 'production') # Use volume snapshot tagged with deployment name

    # find current instances
    # TODO: Check to ensure there's no existing instances

    # clone db instance
    # do this after the server has started because it will take a while to run its startup script, so
    # we might as well be cloning the db instance at the same time, so long is it is available before
    # the server first tries to connect
    create_db_instance_from_snapshot(
        deployment_name,
        'rn-195-migrate-to-rds', # Switch this to 'snapshot' when ready
        instance_type
    )

    print('Successfully deployed RDS instance ' + snapshot)
