var locator = {};

locator = (function (lc) {

	lc.urlprefix = "http://acacias.gov.co/appacacias" //"http://locator.esurprise.co"; //
	lc.map     = {};
	lc.infobox = {};
	lc.center  = {};
	lc.position = {};
	lc.markers = [];
	lc.service = {};
	lc.dirService = {};
	lc.dirDisplay = {};
	lc.infowindow = {};
	lc.userIsLoggedIn = false;
	lc.user = null; //{id:1, name:'John Doe', email:'johndoe@mail.com'};
	
	lc.myLocationMarker = null;
	
	lc.loadRemoteXml = function (data, status, jq) {
		lc.sites.length = 0;
		//data.entry.length = 50;
		$(data.entry).each(function (index) {

			var lat = parseInt(this.content.latitudn.substring(0,1),10)
					+ parseFloat(this.content.latitudn.substring(2,10))/60;
			var lng = -(parseInt(this.content.longitudw.substring(0,2),10)
					+ parseFloat(this.content.longitudw.substring(3,10))/60);
/*
			console.log("("
				+ this.content.latitudn + ","
				+ this.content.longitudw + ")==>("
				+ lat + "," + lng + ")::("
				+ this.content.longitudw.substring(0,2) + ","
				+ parseInt(this.content.longitudw.substring(0,2)) + ")::("
				+ this.content.longitudw.substring(3,10) + ","
				+ parseFloat(this.content.longitudw.substring(3,10)) + ","
				+ parseFloat(this.content.longitudw.substring(3,10))/60 + ")"
			);
*/
			var foto = (typeof(this.content.urlfoto) == 'string') ? this.content.urlfoto : "*img/img-no-disponible.jpg";
			var xcat = this.content.categoria.toLowerCase().replace(/ó/g,"o").replace(/á/g,"a").replace(/\s/g,"_");
			var s = {
				id:this.content.numero, cityid:1, name:this.content.nombre,region:'Meta',country:'Colombia',
				category:this.content.categoria, lat: this.content.cx, lng: this.content.cy, icon:xcat, phone:this.content.telefono,
				latitud: this.content.latitudn, longitud: this.content.longitudw,
				email:this.content.correo,url:this.content.sitio_web,imageUrl:foto,
				addr:this.content.direccion,fb:this.content.facebook,
				tw:(this.content.twitter==='NO REGISTRA') ? this.content.twitter : '',
				yt:this.content.youtube,
				tur:false,pop:false,nite:false,avoid:false,act:false,
				neighborhood:this.content.Barrio,
				locality: this.content.Localidad,
				contact: {
					name: this.content.personadecontactonombrecompleto,
					email: this.content.personadecontactocorreoelectronico,
					phone: this.content.personadecontactocelular
				}
			};
			lc.map.setCenter(lc.center);
			lc.sites[index] = s;
		});	
		
		lc.postinit();
		$.mobile.loading( "hide" );
	};
	
	lc.invokeRemoteXml = function() {
		$.mobile.loading( "show", {
				text: lang.loading,
				textVisible: true,
				theme: "a",
				textonly: false,
				html: ""
		});
		console.log("invokeRemoteXml begin");
		$.ajax({
			type: "post",
			url: lc.urlprefix + "/service/readxml.acacias.php",
			dataType: "json",
			contentType: 'application/json; charset=utf-8',
			success: lc.loadRemoteXml,
			error:function(result){
				$.mobile.loading( "hide" );
				alert('No fue posible cargar los datos!');
				console.log("Error Critico");
				console.log(result);
			}
		});
		//lc.loadRemoteXml();
	};

	

	lc.categories = [
		"alcaldia","cultural","social","deporte_y_recreacion","emergencias","tic_y_tecnologia","servicios","transporte","salud",
		"judicial","turismo","educacion","cultura","recreacion_pasiva","comercial","medios","artesanias","gasolina","restaurante",
		"mensajeria_y_giros","financiero","comida_tipica","hotel","panaderia","religion"
	];

	lc.selectedCategories = [
		"alcaldia","cultural","social","deporte_y_recreacion","emergencias","tic_y_tecnologia","servicios","transporte","salud",
		"turismo","educacion","cultura","recreacion_pasiva","comercial","medios","artesanias","gasolina","restaurante",
		"mensajeria_y_giros","financiero","comida_tipica","hotel","panaderia","religion"
	];
	
	lc.selectedSite = null;

	lc.cities = {
		"acacias":{id: 1, name:'Acacias'    , slug:'acacias', region:'Meta'     , country:'Colombia', lat:3.991328  , lng:-73.759659, weatherC:'30 c' }
		//"stamta" :{id: 2, name:'Santa Marta', slug:'stamta' , region:'Magdalena', country:'Colombia', lat: 11.208797, lng:-74.239751 }
	};

	lc.sites = [];

	lc.isCategorySelected = function (o) {
		for(var i=0;i<lc.selectedCategories.length;i++) {
			if (o.icon == lc.selectedCategories[i]) return true;
		}
		return false;
	};

	lc.checkSelectedCategory = function(val, checked) {
		var i = lc.selectedCategories.length;
		if (checked) {
			lc.selectedCategories[i] = val;
		} else {
			for (i = 0; i < lc.selectedCategories.length; i++) {
				if (lc.selectedCategories[i] == val) break;
			}
			lc.selectedCategories.splice(i, 1);
		}
	};

	lc.onSearchSite = function (e) {
		console.log("onSearchSite called...");
		setupSelectedCategories();
		console.log("onSearchSite setupSelectedCategories called...");
		var cityslug = 'acacias';//$('#city').val();
		if (cityslug == '') return;
		lc.clearLocations();
		lc.clearPlaces();
		var bounds = new google.maps.LatLngBounds();
		var avgLat = 0, avgLng = 0, counter=0;
		
		var city = lc.cities[cityslug];
		var sites = $.grep(lc.sites, function (o) { return o.cityid == city.id; });
		var fsites = $.grep(sites, lc.isCategorySelected);
		console.log("onSearchSite foreach site...");
		$(fsites).each(function (index) {
			counter++;
			avgLat += this.lat;
			avgLng += this.lng;
			bounds.extend(new google.maps.LatLng( this.lat, this.lng ));
			console.log("onSearchSite fsite: "+JSON.stringify(this));
		});
        if( fsites.length > 0){
			console.log("onSearchSite "+fsites.length+" sites found...");
			avgLat = avgLat/counter;
			avgLng = avgLng/counter;
			for (var i=0; i < fsites.length;i++) {
				lc.createMarker(fsites[i]);
				//lc.createPlace(fsites[i]);
			}
			console.log("onSearchSite Markers created...");
			//lc.map.setCenter(new google.maps.LatLng( avgLat, avgLng ) );
			//lc.map.setZoom(20);
			lc.map.fitBounds(bounds);
			console.log("onSearchSite bounds fit...");
			if (counter == 1) {
				lc.map.setZoom(18);
			}
			console.log("onSearchSite zoom set...");
			$("#filtersPanel").panel( "close" );
			$('#resul').hide();
			$('#map').show();
        } else {
			alert("Epaa! No hay sitios de esa categoria!");
		}
		console.log("onSearchSite done!");
	};

	lc.onCheckCategory = function (e) {
		var val = $(this).val();
		var checked = $(this).is(':checked');
		lc.checkSelectedCategory(val, checked);
	};
	
	lc.onSelectSite = function (e) {
		var siteslug = $(this).nearest('li').attr('id');
		lc.clearPlacesExcept(siteslug);
	};
	
	lc.preinit = function() {
		console.log("preinit begin");
		$('#resul').hide();
		$('#cancelSearch').click(function () { canceleSearch(); });
		$('.selectSite').click(function () { canceleSearch(); });
		$('.checkAllCats').click(function () { checkAllCats(); });
		$('.uncheckAllCats').click(function () { uncheckAllCats(); });
		$('#settingProfileL').click(function () { setProfileL(); });
		$('#settingProfileT').click(function () { setProfileT(); });
		$('#sendReview').click(function () {createReview(); });
		$('#sendRating').click(function () {createRating(); });
           $("a[target='_blank']").click(function(event) {
                                          
                                          event.preventDefault();
                                          window.open($(this).attr("href"), '_blank', 'location=yes');
                                          });

		$('#searchBox').focus(function () {
			$("#map").hide();
			$("#resul").show();
			$(".searchResultList").hide();
		});
	   
		$('#searchBox').keydown(function () {
			if ($(this).val().length >= 2)
				searchPlace($(this).val());
		});
		$('.ranking a').click(function(){configStar($(this).data('rate'));});
		var styledMap = false;
        if (_locator_styles)  { styledMap = new google.maps.StyledMapType(_locator_styles, {name: "Acacias"}); }
        lc.center = new google.maps.LatLng(3.991328,-73.759659);
		lc.position = lc.center;
		
		lc.map = new google.maps.Map(document.getElementById('map'), {
		  mapTypeId: google.maps.MapTypeId.ROADMAP,
		  center: lc.center,
		  zoom: 14,
          disableDefaultUI: true,
          zoomControl: true
		});

		lc.map.mapTypes.set('map_style', styledMap);
		lc.map.setMapTypeId('map_style');		

		lc.infowindow = new google.maps.InfoWindow();
		lc.service = new google.maps.places.PlacesService(lc.map);
		lc.dirService = new google.maps.DirectionsService();
		lc.dirDisplay = new google.maps.DirectionsRenderer();
		lc.dirDisplay.setMap(lc.map);
		
		$('#city').change(lc.onSearchSite);
           $('#filter').click(lc.onSearchSite);
        $('.js-lang').change(lc.onchangeLang);
           $('#okhelp').click(function(){
                               ldb.setConfigValue('runned',1);
                               });
		$('.chkCategory').click(lc.onCheckCategory);

		$(document).on("pageload",function (e) {
			obj = jQuery.grep(locator.sites, function (obj) { return obj.id==$('.js-number').val(); }); 
			if(obj && obj.length>0)
				loadArticle(obj[0]);
		});
		
		$(window).resize(function () {
			var sh = window.innerHeight;
			var hh = $('#header').height()+42;
			var fh = $('#footer').height();
			$('#content').height((sh-hh-fh-4)+'px');
			$('#categoryMenu').height((sh-hh-fh-10)+'px');
		});
		$(window).resize();
		$('.categories ul li a').addClass('js-checked').click(function (e) {
			$(this).toggleClass('js-checked');
			
			var i = lc.selectedCategories.length;
			var val = $(this).data('cat');
			var checked = $(this).hasClass('js-checked');
			lc.checkSelectedCategory(val, checked);
		});

		$("#openFiltersPanel").click(function() {
			var cityslug = 'acacias';//$('#city').val();
			if (cityslug == ''){ alert('Por favor seleccione un departamento'); return false;}
			else{$( "#filtersPanel" ).panel( "open"  );}
		});
			
		$('#currentpos').click(function (e) {
			console.log("currentpos getCurrentPosition");
			navigator.geolocation.getCurrentPosition(function (position) {
				console.log("getCurrentPosition success!");
				lc.placeMyLocationMarker(position);
				lc.map.setCenter(new google.maps.LatLng(position.coords.latitude, position.coords.longitude));
                                                     lc.map.setZoom(15);
			}, function (error) {
				alert(lang.errorGetCurrentPos);
				console.log("getCurrentPosition error!");
				switch(error.code) 
				{
				case error.PERMISSION_DENIED:
					console.log("User denied the request for Geolocation.");
					break;
				case error.POSITION_UNAVAILABLE:
					console.log("Location information is unavailable.");
					break;
				case error.TIMEOUT:
					console.log("The request to get user location timed out.");
					break;
				case error.UNKNOWN_ERROR:
					console.log("An unknown error occurred.");
					break;
				}
			});
		});
		
		$('#cleardirs').click(function (e) {
			lc.clearDirections();
		}).addClass('ui-disabled');

         lc.getSettings();
	}
	
	lc.postinit = function() {
		console.log("postinit begin");
		console.log("trigger map resize and center");
		google.maps.event.trigger(lc.map, 'resize');
		lc.map.setCenter(lc.center);
		
		//$("#filter").click();
	}
	
	lc.init = function () {
		lc.preinit();
		lc.invokeRemoteXml();
		//lc.postinit();
	};

	lc.createMarker = function(site) {
		var loc = new google.maps.LatLng(site.lat,site.lng);
		var options = {
			map: lc.map,
			position: loc,
			icon: lc.urlprefix + '/img/icons/catx.'+site.icon+'.png',
			shadow: lc.urlprefix + '/img/icons/cat.sh.png'
		};
		console.log("createMarker");
		console.log(lc.urlprefix + '/img/icons/catx.'+site.icon+'.png');
		var marker = new google.maps.Marker(options);

		google.maps.event.addListener(marker, 'click', function() {
			$('#siteName').text(site.name);
			var pos = new google.maps.LatLng(site.lat, site.lng);
			lc.map.setCenter(pos);
			lc.map.setZoom(15);
            lc.infowindow.setContent("<div class='infowindow'><h1 class='boxtitle'>"+site.name+"</h1><p class='boxaddr'>"+site.addr+"</p><a class='js-howto boxhowto' href='javascript:locator.showDirections();' border='0'><img src='img/road.png'/></a><a style='margin-left:4px;' class='boxdetail boxlink' href='#infoPanel' border='0'><img src='img/32x32.png'/></a></div>");
			
			lc.infowindow.open(lc.map, marker);
              lc.clearDirections();                        
			lc.selectedSite = site;
			loadArticle(site);
		});
		lc.markers.push(marker);
	};
	lc.clearDirectionsEnabled = false;
	lc.clearLocations = function () {
		lc.infowindow.close();
		for (var i = 0; i < lc.markers.length; i++) {
			lc.markers[i].setMap(null);
		}
		lc.markers.length = 0;
	};
	
	lc.clearPlacesExcept = function (siteid) {
		$('#places .place').not('#site_' + siteid).remove();
		$('#places').listview('refresh');
	};
	
	lc.clearPlaces = function () {
		$('#places .place').remove();
	};
	
	lc.createPlace = function (site) {
		var link = $("<div data-role='collapsible' class='place'><h3>" + site.name + "</h3><p>Lorem Ipsum dolor sit amet</p><a href='page.php?site="+site.id+"' data-role='button' data-icon='arrow-r' data-inline='true' data-transition='slide' data-rel='dialog'>Detalles</a></div>");
		//link.collapsible();
		link.bind('expand',function (e) {
			lc.map.setCenter(new google.maps.LatLng( site.lat, site.lng ));
			lc.map.setZoom(18);
			//$('#thepage').data('site',site);
			//lc.clearPlacesExcept(site.siteid);
		});
		link.bind();
		$('#places').append(link);
		$('#places').trigger('create');//.listview('refresh');
	};
	
	lc.clearDirectionsEnabled = false;
	lc.clearDirections = function () {
		if (lc.clearDirectionsEnabled) {
			$('#cleardirs').addClass('ui-disabled');
			lc.dirDisplay.setMap(null);
		}
	};
	
	lc.showDirections = function () {
        console.log("Show Directions called...");
		if (lc.selectedSite && lc.myLocationMarker) {
			console.log("Go From Your location to: " + lc.selectedSite.name);
			$('#cleardirs').removeClass('ui-disabled');
			lc.clearDirectionsEnabled = true;
			lc.dirDisplay.setMap(lc.map);
			var req = {
				origin: lc.myLocationMarker.getPosition(),
				destination: new google.maps.LatLng(lc.selectedSite.lat, lc.selectedSite.lng),
				travelMode: google.maps.TravelMode.DRIVING
			};
			
			lc.dirService.route(req, function (response, status) {
				console.log("Dir service response: " + JSON.stringify(response) + "... status:" + status);
				if (status == google.maps.DirectionsStatus.OK) {
					console.log("Status OK, set Directions...");
					lc.dirDisplay.setDirections(response);
				} else {
					console.log("Something wrong with the direction service...");
				}
			});
			lc.infowindow.open(null);
		} else {
			console.log("No Site selected or no available marker");
		}
	};
	
	lc.activateShowMyLocation = function(activate) {
		if (activate) {
			lc.showMyLocation();
		} else {
			if (lc.showMyLocationTimer) {
				clearTimeout(lc.showMyLocationTimer);
			}
		}
	};

	lc.placeMyLocationMarker = function (position) {
		var userLatLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
		if (lc.myLocationMarker == null) {
			lc.myLocationMarker = new google.maps.Marker({
				map: lc.map,
				position: userLatLng,
                icon: lc.urlprefix + '/img/icons/me.png'
                //shadow: lc.urlprefix + '/img/icons/cat.sh.png'

			});
		} else {
			lc.myLocationMarker.setPosition(userLatLng);
		}
	};
/*
	lc.showMyLocationTimer = null;
	lc.onReceiveMyLocation = function(position) {
		lc.placeMyLocationMarker(position);
		console.log("onReceiveMyLocation setTimeout");
		lc.showMyLocationTimer = setTimeout(lc.showMyLocation, 10000);
	};

	lc.onActivateReceiveMyLocation = function (position) {
		lc.placeMyLocationMarker(position);
		lc.map.setCenter(new google.maps.LatLng(position.coords.latitude, position.coords.longitude));
		console.log("onActivateReceiveMyLocation setTimeout");
		lc.showMyLocationTimer = setTimeout(lc.showMyLocation, 10000);
	};
	
	lc.showMyLocation = function() {
		console.log("showMyLocation getCurrentPosition");
		navigator.geolocation.getCurrentPosition(lc.onActivateReceiveMyLocation);
	};
	*/
	lc.showMayor = function() {
		$("#mayorPanel").panel("open");
	};
           
	lc.getSettings=function(){

        var prof=ldb.getConfigValue("prof");
		var lng=ldb.getConfigValue("lang");
		lc.setLang(lng);
		if (prof=="settingProfileL"){
			$("#settingProfileL" ).prop( "checked", true ).checkboxradio( "refresh" );
			$("#settingProfileT" ).prop( "checked", false ).checkboxradio( "refresh" );
		} else {
			$("#settingProfileT" ).prop( "checked", true ).checkboxradio( "refresh" );
			$("#settingProfileL" ).prop( "checked", false ).checkboxradio( "refresh" );
		}
		if (lng=="es"){
			$("#langes" ).prop( "checked", true ).checkboxradio( "refresh" );
			$("#langen" ).prop( "checked", false ).checkboxradio( "refresh" );
		} else {
			$("#langen" ).prop( "checked", true ).checkboxradio( "refresh" );
			$("#langes" ).prop( "checked", false ).checkboxradio( "refresh" );
		}
		if($( "#settingProfileL" ).prop( "checked" )) {setProfileL();}
		else { setProfileT();}
		
    };
	
	lc.setLang = function(langid) {
		var catfile = (langid=='es') ? 'menu-cat.jpg':'menu-cat-en.jpg';
		$('#categoryMenu a').css({backgroundImage:'url(img/' + catfile + ')'});
		if (lang) {
			lang = (langid=='en') ? lang_en :
				   (langid=='fr') ? lang_fr :
				   (langid=='pt') ? lang_pt :
			       lang_es;
			$('.js-lang').each(function (index) {
				var key = $(this).data('lang');
				if (key) { $(this).text(lang[key]);	}
			});
			$('.js-lang-ph').each(function(index) {
				var key = $(this).data('lang');
				if (key) { $(this).attr({ placeholder: lang[key] });	 }
			});
		}

		if (ldb) {
			ldb.setConfigValue("lang",langid);
		}
	};

	lc.onchangeLang=function(e){
		var val = '';
		val = $("#langes").prop("checked") ? "es": '';
		if (val=='') val = $("#langfr").prop("checked") ? "fr": '';
		if (val=='') val = $("#langpt").prop("checked") ? "pt": '';
		if (val=='') val = $("#langen").prop("checked") ? "en": '';
		lc.setLang(val);
		console.log("Language Changed to '"+val+"'");
    };
	
	return lc;
}(locator));

function loadArticle(obj){
	if(obj){
		var imgUrl = obj.imageUrl;
		if (imgUrl.match(/^\*/)) {
			imgUrl = imgUrl.replace(/^\*/,'');
		} else {
			imgUrl = 'http://' + imgUrl;
		}
		console.log(imgUrl);
		$('.js-title').html(obj.name);
		$('.js-addr').html(obj.addr);
		$('.js-url').attr("href","http://"+obj.url);
		$('.js-imageUrl').attr("src",imgUrl);
		//$('.js-cell').html(obj.contact.name);
		$('.js-phone').html(obj.contact.phone);
		$('.js-email').html(obj.contact.email);
		$('.js-tw').attr("href","http://twitter.com/"+obj.tw);
		$('.js-tw').html(obj.tw);
		$('.js-addr').html(obj.addr);
        $('.js-artmap').attr("href","javascript:displayItemOnMap("+obj.id+");");
        $('.js-cname').html(obj.contact.name);
		
		$('.js-lat').html(obj.lat);
		$('.js-lng').html(obj.lng);
		$('.js-latitud').html(obj.longitud);
		$('.js-longitud').html(obj.latitud);

		getReviews();
		getRating();
	}
}

function canceleSearch() {
	$("#map").show();
    google.maps.event.trigger(locator.map, 'resize');
	$("#resul").hide();
	$('#searchBox').val('');
        }
function searchPlace(param) {

	$('.searchResultList').empty();
	 $(".searchResultList").hide();
	obj = jQuery.grep(locator.sites, function (obj) { return  (obj.name.toLowerCase().indexOf(param.toLowerCase()) >= 0)}); 
	if(obj && obj.length>0)	{
		for(var i=0;i<obj.length;i++) {
			var p=obj[i];
			var newItem=$("#_baseSearchItems li").clone();
			$(newItem).find(".js-itemImg").addClass(p.icon.toLowerCase());
			$(newItem).find(".js-itemTitle").html(p.name);
			$(newItem).find(".js-ItemDescription").html(p.addr);
			$(newItem).find(".js-viewDetail").attr("href","javascript:loadItemdetail("+p.id+");");
			$(newItem).find(".js-itemMap").attr("href","javascript:displayItemOnMap("+p.id+");");
			$(newItem).appendTo( '.searchResultList' );
			
		}
	}
	$( ".searchResultList" ).listview( "refresh" );
        $(".searchResultList").show();
 }
        
function uncheckAllCats(){
	$('.categories ul li a').removeClass('js-checked');
}
function checkAllCats(){
	$('.categories ul li a').addClass('js-checked');
}
function setupSelectedCategories(){
	locator.selectedCategories=[];
	$('.js-checked').each(function(){
		locator.selectedCategories.push($(this).data('cat'));
	})
}
function setProfileL(){
	uncheckAllCats();
	$('.profileL').addClass('js-checked');
    if (ldb)
        ldb.setConfigValue("prof","settingProfileL");
    
}
function setProfileT(){
	uncheckAllCats();
	$('.profileT').addClass('js-checked');
    if (ldb)
        ldb.setConfigValue("prof","settingProfileT");
    
}
function loadItemdetail(id) { 
	site=getSite(id)
	loadArticle(site); 
	$('#infoPanel').panel('open'); 
}

function getSite(id){
obj = jQuery.grep(locator.sites, function (obj) { return  obj.id==id}); 
	if(obj && obj.length>0)	{
		return obj[0];
	}
}

function displayItemOnMap(id){
	site=getSite(id);
	if(site){
		$('#resul').hide();
		$('#map').show();
		$('#infoPanel').panel('close')
		locator.clearLocations();
		locator.clearPlaces();
		locator.createMarker(site);
		locator.map.setCenter(new google.maps.LatLng( site.lat, site.lng ));
		locator.map.setZoom(16);
	}
}

function createReview(){
if(locator.selectedSite && $('#textReview').val().length >0){
	var v= $('#textReview').val();
	var u=locator.user.id;
	var p=locator.selectedSite.id;
	console.log("createReview p:"+p+", u:"+u+", v:'"+v+"'");
		$.ajax({
			url: locator.urlprefix + "/service/createreview.php",
			type: "post",
			dataType:"json",
			data: {rev:v, uid:u, pid:p},
			success: function(data){
				console.log("data received");
				if(data.success){
					console.log("success! "+JSON.stringify(data));
					$('#place_comments').prepend(
						$('<li></li>').html("<b>" + data.output.name + "</b><br/> " + data.output.review)
					).listview('refresh');
					$('#textReview').val('');
					//alert(lang.sendReviewSuccess);
				}
			},
			error:function (data){
				alert(lang.errorCreateReview);
			}
		});
	}
}

function createRating(){
	if(locator.selectedSite){
		var v=$('#selectedRating').val();
		var u=locator.user.id;
		var p=locator.selectedSite.id;
			$.ajax({
				url: locator.urlprefix + "/service/createrating.php",
				type: "post",
				dataType:"json",
				data: {val : v, uid:u, pid:p},
				success: function(data){
				if(data.success)
					{
						$('#textReview').val('');
				 		alert(lang.sendReviewSuccess);
					}
				},
				error:function (data){
					alert(lang.errorCreateRating);
				}
			});
	}
	
}

function getReviews(){
	//console.log("Calling getReviews");
	$('#place_comments').empty();
	if(locator.selectedSite){
		$.ajax({
			url: locator.urlprefix + "/service/getreview.php",
			type: "POST",
			dataType:"json",
			data: {pid:locator.selectedSite.id},
			success: function(data){
				//console.log(data);
				if(data.success) {
					$(data.output).each(function (index) {
						$('#place_comments').append(
							$('<li></li>').html("<b>" + this.name + "</b><br/> " + this.review)
						);
					});
				}
				$('#place_comments').listview('refresh');
			},
			error:function (data){
				//alert(lang.errorCreateComments);
			}
		});
	}
}
function getRating(){
	if(locator.selectedSite){
		$.ajax({
			url: locator.urlprefix + "/service/getrating.php",
			type: "POST",
			dataType:"json",
			data: {pid:locator.selectedSite.id},
			success: function(data){
				console.log(data);
				if (data.success) {
					$(data.output.counts).each(function (index) {
						$('#star_amount_' + this.value).text(this.count);
					});
				}
				//if(data.success) alert('success!');
			},
			error:function (data){
				//alert(lang.errorGetRatings);
			}
		});
	}
}

function configStar(val){
$('#selectedRating').val(val);
	$('.ranking a').removeClass('star-on');
	$('.ranking a').addClass('star-off');
	$('.ranking a').each(function(){
		if ($(this).data('rate')<=val){
			$(this).removeClass('star-off');
			$(this).addClass('star-on');
		}
		
	});
}
function defaultImg(image) {
    //image.onerror = "";
    image.src = "img/defim.png";
    return true;
}

//fbarrera@intcomex.com
//xclweb2+AA

