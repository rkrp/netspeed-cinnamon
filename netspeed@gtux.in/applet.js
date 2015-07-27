const Applet = imports.ui.applet;
const Util = imports.misc.util;
const Lang = imports.lang;
const Mainloop = imports.mainloop;
const GLib = imports.gi.GLib;

function MyApplet(orientation, panel_height, instance_id) {
    this._init(orientation, panel_height, instance_id);
}

MyApplet.prototype = {
    __proto__: Applet.TextIconApplet.prototype,

    title: 0,

    old_rx : 0,
    old_tx : 0,

    //Download data provider
    rx_path_template: "/sys/class/net/%s/statistics/rx_bytes",
    rx_path: "",

    //Upload data provider
    tx_path_template: "/sys/class/net/%s/statistics/tx_bytes",
    tx_path: "",

    _init: function(orientation, panel_height, instance_id) {
        Applet.TextIconApplet.prototype._init.call(this, orientation, panel_height, instance_id);

        //this.set_applet_icon_name("force-exit");
        this.set_applet_tooltip(_("Change Network ifaces"));
        this.set_applet_label("NetSpeeds");
        
        //TODO
        //Option to select network iface
        var iface = "wlp1s0";
        this.rx_path = this.rx_path_template.replace("%s", iface);
        this.tx_path = this.tx_path_template.replace("%s", iface);
    
        this._update_speed();
    },

    _update_speed: function() {
        let down_speed = this._get_down_speed();
        let up_speed = this._get_up_speed();
        this.set_applet_label(down_speed + " KB/s ▼ " + up_speed + " KB/s ▲");

        //Use MainLoop to run this function every 1000 ms
        Mainloop.timeout_add(1000, Lang.bind(this, this._update_speed));
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
    
    on_applet_clicked: function() {
        
    }
};

function main(metadata, orientation, panel_height, instance_id) {
    return new MyApplet(orientation, panel_height, instance_id);
}
