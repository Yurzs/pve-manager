package PVE::API2::BackupInfo;

use strict;
use warnings;
use Digest::SHA;

use PVE::SafeSyslog;
use PVE::Tools qw(extract_param);
use PVE::Cluster qw(cfs_lock_file cfs_read_file cfs_write_file);
use PVE::RESTHandler;
use PVE::RPCEnvironment;
use PVE::JSONSchema;
use PVE::Storage;
use PVE::Exception qw(raise_param_exc);
use PVE::VZDump;
use PVE::VZDump::Common;

use base qw(PVE::RESTHandler);

sub get_included_vmids {
    my $vzconf = cfs_read_file('vzdump.cron');

    my $all_jobs = $vzconf->{jobs} || [];
    my @all_vmids = ();

    for my $job (@$all_jobs) {
	my $job_included_guests = PVE::VZDump::get_included_guests($job);
	push @all_vmids, ( map { @{$_} } values %{$job_included_guests} );
    }

    return { map { $_ => 1 } @all_vmids };
}

__PACKAGE__->register_method({
    name => 'get_backupinfo',
    path => '',
    method => 'GET',
    protected => 1,
    description => "Stub, waits for future use.",
    parameters => {
       additionalProperties => 0,
       properties => {},
    },
    returns => {
       type => 'string',
       description => 'Shows stub message',
    },
    code => sub {
       return "Stub endpoint. There is nothing here yet.";
    }});

__PACKAGE__->register_method({
    name => 'get_guests_not_in_backup',
    path => 'not_backed_up',
    method => 'GET',
    protected => 1,
    description => "Shows all guests which are not covered by any backup job.",
    permissions => {
	check => ['perm', '/', ['Sys.Audit']],
    },
    parameters => {
    	additionalProperties => 0,
	properties => {},
    },
    returns => {
	type => 'array',
	description => 'Contains the guest objects.',
	items => {
	    type => 'object',
	    properties => {
		vmid => {
		    type => 'integer',
		    description => 'VMID of the guest.',
		},
		name => {
		    type => 'string',
		    description => 'Name of the guest',
		    optional => 1,
		},
		type => {
		    type => 'string',
		    description => 'Type of the guest.',
		    enum => ['qemu', 'lxc'],
		},
	    },
	},
    },
    code => sub {
	my $rpcenv = PVE::RPCEnvironment::get();
	my $user = $rpcenv->get_user();
	my $rrd = PVE::Cluster::rrd_dump();
	my $included_vmids = get_included_vmids();
	my $vmlist = PVE::Cluster::get_vmlist();
	my @vmids = ( keys %{$vmlist->{ids}} );

	# remove VMIDs to which the user has no permission to not leak infos
	# like the guest name
	my @allowed_vmids = grep {
		$rpcenv->check($user, "/vms/$_", [ 'VM.Audit' ], 1);
	} @vmids;

	my $result = [];

	for my $vmid (@allowed_vmids) {

	    next if $included_vmids->{$vmid};

	    my $type = $vmlist->{ids}->{$vmid}->{type};
	    my $node = $vmlist->{ids}->{$vmid}->{node};

	    my $conf;
	    my $name = "";

	    if ($type eq 'qemu') {
		$conf = PVE::QemuConfig->load_config($vmid, $node);
		$name = $conf->{name};
	    } elsif ($type eq 'lxc') {
		$conf = PVE::LXC::Config->load_config($vmid, $node);
		$name = $conf->{hostname};
	    } else {
		die "VMID $vmid is neither Qemu nor LXC guest\n";
	    }

	    push @{$result}, {
		vmid => int($vmid),
		name => $name,
		type => $type,
	    };
	}

	return $result;
    }});
1;
