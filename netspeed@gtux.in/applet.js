const Applet = imports.ui.applet;
const PopupMenu = imports.ui.popupMenu;
const Settings = imports.ui.settings;

const Util = imports.misc.util;
const FileUtils = imports.misc.fileUtils;

const Lang = imports.lang;
const Mainloop = imports.mainloop;

const GLib = imports.gi.GLib;
const St = imports.gi.St;

function MyApplet(orientation, panel_height, instance_id) {
    this._init(orientation, panel_height, instance_id);
}

MyApplet.prototype = {
    __proto__: Applet.TextIconApplet.prototype,

    title: 0,

    old_rx : 0,
    old_tx : 0,

    stop_loop : false,

    iflist  : [],
    selected_iface : "lo",

    //Download data provider
    rx_path_template: "/sys/class/net/%s/statistics/rx_bytes",
    rx_path: "",

    //Upload data provider
    tx_path_template: "/sys/class/net/%s/statistics/tx_bytes",
    tx_path: "",

    //Routes data provider
    routes_file: "/proc/net/route",

    _init: function(orientation, panel_height, instance_id) {
		try {
			Applet.TextIconApplet.prototype._init.call(this, orientation, panel_height, instance_id);

			this.set_applet_tooltip(_("Right click to change network interfaces"));

			this.settings = new Settings.AppletSettings(this, "netspeed@gtux.in", this.instance_id);
			this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "iface-in-use", "selected_iface", this._on_settings_changed, null);
			
			//Option to select network iface
			this.iflist = this._get_interfaces_list();

			//Automatic interface selection
			this._auto_iface();

			this._on_settings_changed();

		} catch(e) {
			global.logError(e);
		} 
    },

    _auto_iface: function() {
        var file_data = GLib.file_get_contents(this.routes_file);
        if(file_data[0]) {
            this.selected_iface = String(file_data[1]).split("\n")[1].split('\t')[0]
        }

        Mainloop.timeout_add(5 * 60 * 1000, Lang.bind(this, this._auto_iface));
    },

    _update_paths: function() {
        //Downloads provider
        this.rx_path = this.rx_path_template.replace("%s", this.selected_iface);

        //Uploads provider
        this.tx_path = this.tx_path_template.replace("%s", this.selected_iface);
    },

    _update_speed: function() {
		let down_speed = this._get_down_speed();
		let up_speed = this._get_up_speed();
		this.set_applet_label(down_speed + " KB/s ▼ " + up_speed + " KB/s ▲");

		if(!this.stop_loop)
			//Use MainLoop to run this function every 1000 ms
			Mainloop.timeout_add(1000, Lang.bind(this, this._update_speed));
		else
			this.set_applet_label(this.stop_label);
    },

    _get_down_speed: function(iface) {
        var bytes_received = GLib.file_get_contents(this.rx_path);

        if(bytes_received[0]) {
            var new_rx = parseInt(bytes_received[1]);

            //toFixed() returns a string. Otherwise, must use toString()
            var current_speed = ((new_rx - this.old_rx)/1024).toFixed(2);

            //Save the current value in old_rx
            this.old_rx = new_rx;
        }

        GLib.free(bytes_received);
        return current_speed;
    },

    _get_up_speed: function(iface) {
        var bytes_sent = GLib.file_get_contents(this.tx_path);

        if(bytes_sent[0]) {
            let new_tx = parseInt(bytes_sent[1]);

            //toFixed() returns a string. Otherwise, must use toString()
            var current_speed = ((new_tx - this.old_tx)/1024).toFixed(2);

            //Save the current value in old_tx
            this.old_tx = new_tx;
        }

        GLib.free(bytes_sent);
        return current_speed;
    },

    _get_interfaces_list: function() {
        var dev_data = GLib.file_get_contents('/proc/net/dev');
        var iflist = [];
        if(dev_data[0]) {
            var lines = String(dev_data[1]).split("\n");
            //Omit the first two lines
            for(let i = 2 ; i < lines.length ; i++) {                
                var separator_pos = lines[i].indexOf(":");
                var iface = lines[i].substring(0, separator_pos).trim();
                if(iface.length != 0)
                    iflist[i - 2] = iface;
            }
        }

        return iflist;
    },

    _on_settings_changed: function() {
		let index = this.iflist.indexOf(this.selected_iface);
		if(index < 0) {
			this.stop_label = "Invalid Interface";
			this.stop_loop = true;
			return;
		} else {
			this.stop_loop = false;
		}
		this._update_paths();
		this._update_speed();
	},
    
    on_applet_clicked: function() {
        this.menu.toggle();
    }
};

function main(metadata, orientation, panel_height, instance_id) {
    return new MyApplet(orientation, panel_height, instance_id);
}
