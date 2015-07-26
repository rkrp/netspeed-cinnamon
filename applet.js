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

    rx_path_template: "/sys/class/net/%s/statistics/rx_bytes",
    rx_path: "",

    _init: function(orientation, panel_height, instance_id) {
        Applet.TextIconApplet.prototype._init.call(this, orientation, panel_height, instance_id);

        //this.set_applet_icon_name("force-exit");
        this.set_applet_tooltip(_("Change Network ifaces"));
        this.set_applet_label("NetSpeeds");
        
        //TODO
        //Option to select network iface
        var iface = "wlp1s0";
        this.rx_path = this.rx_path_template.replace("%s", iface);
    
        this._update_speed();
    },

    _update_speed: function() {
        this._get_speed();
        this.set_applet_label(this.title);

        //Use MainLoop to run this function every 1000 ms
        Mainloop.timeout_add(1000, Lang.bind(this, this._update_speed));
    },

    _get_speed: function(iface) {
        var speed = GLib.file_get_contents(this.rx_path);

        if(speed[0]) {
            var new_rx = parseInt(speed[1]);

            //toFixed() returns a string. Otherwise, must use toString()
            this.title = ((new_rx - this.old_rx)/1024).toFixed(2) + " KB/s";

            //Save the current value in old_rx
            this.old_rx = new_rx;
        }

        GLib.free(speed);
        
    },
    
    on_applet_clicked: function() {
        Util.spawn('dasdas');
    }
};

function main(metadata, orientation, panel_height, instance_id) {
    return new MyApplet(orientation, panel_height, instance_id);
}
