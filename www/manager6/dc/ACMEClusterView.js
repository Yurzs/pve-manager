Ext.define('pve-acme-accounts', {
    extend: 'Ext.data.Model',
    fields: ['name'],
    proxy: {
	type: 'proxmox',
	    url: "/api2/json/cluster/acme/account",
    },
    idProperty: 'name',
});

Ext.define('pve-acme-plugins', {
    extend: 'Ext.data.Model',
    fields: ['type', 'plugin'],
    proxy: {
	type: 'proxmox',
	url: "/api2/json/cluster/acme/plugins",
    },
    idProperty: 'plugin',
});

Ext.define('PVE.dc.ACMEAccountView', {
    extend: 'Ext.grid.Panel',
    alias: 'widget.pveACMEAccountView',

    title: gettext('Accounts'),

    controller: {
	xclass: 'Ext.app.ViewController',

	addAccount: function() {
	    let me = this;
	    Ext.create('PVE.node.ACMEAccountCreate', {
		taskDone: function() {
		    me.reload();
		},
	    }).show();
	},

	viewAccount: function() {
	    let me = this;
	    let view = me.getView();
	    let selection = view.getSelection();
	    if (selection.length < 1) return;
	    Ext.create('PVE.node.ACMEAccountView', {
		accountname: selection[0].data.name,
	    }).show();
	},

	reload: function() {
	    let me = this;
	    let view = me.getView();
	    view.getStore().load();
	},
    },

    columns: [
	{
	    dataIndex: 'name',
	    text: gettext('Name'),
	    renderer: Ext.String.htmlEncode,
	    flex: 1,
	},
    ],

    tbar: [
	{
	    xtype: 'proxmoxButton',
	    text: gettext('Add'),
	    selModel: false,
	    handler: 'addAccount',
	},
	{
	    xtype: 'proxmoxButton',
	    text: gettext('View'),
	    handler: 'viewAccount',
	    disabled: true,
	},
	{
	    xtype: 'proxmoxStdRemoveButton',
	    baseurl: '/cluster/acme/account',
	    callback: 'reload',
	},
    ],

    listeners: {
	itemdblclick: 'viewAccount',
    },

    store: {
	model: 'pve-acme-accounts',
	autoLoad: true,
	sorters: 'name',
    },
});

Ext.define('PVE.dc.ACMEPluginView', {
    extend: 'Ext.grid.Panel',
    alias: 'widget.pveACMEPluginView',

    title: gettext('Plugins'),

    controller: {
	xclass: 'Ext.app.ViewController',

	addPlugin: function() {
	    let me = this;
	    Ext.create('PVE.dc.ACMEPluginEditor', {
		isCreate: true,
		apiCallDone: function() {
		    me.reload();
		},
	    }).show();
	},

	editPlugin: function() {
	    let me = this;
	    let view = me.getView();
	    let selection = view.getSelection();
	    if (selection.length < 1) return;
	    let plugin = selection[0].data.plugin;
	    Ext.create('PVE.dc.ACMEPluginEditor', {
		url: `/cluster/acme/plugins/${plugin}`,
		apiCallDone: function() {
		    me.reload();
		},
	    }).show();
	},

	reload: function() {
	    let me = this;
	    let view = me.getView();
	    view.getStore().load();
	},
    },

    columns: [
	{
	    dataIndex: 'plugin',
	    text: gettext('Plugin'),
	    renderer: Ext.String.htmlEncode,
	    flex: 1,
	},
	{
	    dataIndex: 'api',
	    text: gettext('API'),
	    renderer: Ext.String.htmlEncode,
	    flex: 1,
	},
    ],

    tbar: [
	{
	    xtype: 'proxmoxButton',
	    text: gettext('Add'),
	    handler: 'addPlugin',
	    selModel: false,
	},
	{
	    xtype: 'proxmoxButton',
	    text: gettext('Edit'),
	    handler: 'editPlugin',
	    disabled: true,
	},
	{
	    xtype: 'proxmoxStdRemoveButton',
	    baseurl: '/cluster/acme/plugins',
	    callback: 'reload',
	},
    ],

    listeners: {
	itemdblclick: 'editPlugin',
    },

    store: {
	model: 'pve-acme-plugins',
	autoLoad: true,
	filters: item => !!item.data.api,
	sorters: 'plugin',
    },
});

Ext.define('PVE.dc.ACMEClusterView', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.pveACMEClusterView',

    onlineHelp: 'sysadmin_certificate_management',

    items: [
	{
	    region: 'north',
	    border: false,
	    xtype: 'pveACMEAccountView',
	},
	{
	    region: 'center',
	    border: false,
	    xtype: 'pveACMEPluginView',
	},
    ],
});