/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var init_facebook = null;
var check_facebook = null;
var get_facebook_info = null;
var login_facebook = null;
var logout_facebook = null;
var ldb =ldb||{};

var app = {
    // Application Constructor
initialize: function() {
    this.bindEvents();
},
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
bindEvents: function() {
    document.addEventListener('deviceready', this.onDeviceReady, false);
},
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicity call 'app.receivedEvent(...);'
onDeviceReady: function() {
    checkConnection();
   if(init_facebook) init_facebook();
   if(check_facebook) check_facebook();
    ldb.initConfigValues();
    app.receivedEvent('deviceready');
    
},
    // Update DOM on a Received Event
receivedEvent: function(id) {
    var parentElement = document.getElementById(id);
    if(parentElement!=null){
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');
        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');
        console.log('Received Event: ' + id);
    }
}
};

var ldb={
configValues:[],
keyValue:"",
keyName:"",

initConfigValues: function(){
    console.log('local values first run...');
    if(window.localStorage.getItem('runned')==null){
        // First RUN
        window.localStorage.setItem('lang','en');
        window.localStorage.setItem('prof','settingProfileT');
        window.localStorage.setItem('runned','1');
        console.log('local values first run succeed.');
            }
    
},
setConfigValue:function(name,val){
    window.localStorage.setItem(name,val);
    console.log("config set"+name+val)
},
    
getConfigValue:function(name){
        console.log("get:"+name)
        return window.localStorage.getItem(name)
    }
    
};

function checkConnection() {
    console.log('validando conexion...');
    var networkState = navigator.network.connection.type;
    var states = {};
    states[Connection.UNKNOWN] = 'Unknown connection';
    states[Connection.ETHERNET] = 'Ethernet connection';
    states[Connection.WIFI] ='WiFi connection';
    states[Connection.CELL_2G] = 'Cell 2G connection';
    states[Connection.CELL_3G] = 'Cell 3G connection';
    states[Connection.CELL_4G] = 'Cell 4G connection';
    states[Connection.NONE] = 'No network connection';
    console.log('coneccion validada...');
    console.log(states[networkState]);
    if((states[networkState] == 'No network connection') || (states[networkState] == 'Unknown connection')){
        //alert('Necesitas tener conexión a internet, por favor verifica y reinicia la app.');
		location.href="error.html";
    }
}

