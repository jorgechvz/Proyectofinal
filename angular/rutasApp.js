//MOdule para mostrar las rutas

angular.module('rutasApp', []);


var colors = ['#000000', '#FF0000', '#0000FF', '#058C09', '#0CB7F2', '#C106D7', '#FFBE33'];
// var colors = ['negro', 'rojo', 'azul', 'verdeoscuro', 'celeste', 'purpura', 'naranja', ];

var getCurrentPosition = function(callback) {
  navigator.geolocation.getCurrentPosition(function(location) {
    // var location = {lat: location.coords.latitude, lng: location.coords.longitude};
    var ptoInicio = {lat: location.coords.latitude, lng: location.coords.longitude};
    callback(ptoInicio);
  });
};

var getDistanceFromLatLonInKm = function(lat1,lon1,lat2,lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1);
  var a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ;
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  var d = R * c; // Distance in km
  return d;
}

var deg2rad = function(deg) {
  return deg * (Math.PI/180)
}

var myControllerCtrl = function ($scope, rutasData, CONFIG) {
  $scope.title = "Rutas Transporte Público Arequipa";
  $scope.titleTab = "Rutas Arequipa";
  // $scope.subtitle = "by: Jerson Herrera Rivera";
  $scope.subtitle = "by: jerherrerar@gmail.com";
  $scope.contact = "contact: jerherrerar@gmail.com";
  $scope.pathIcon = "/img/icon2.png";
  $scope.apiKeyGoogle = "AIzaSyBJoWpw9OqgPNbbud1AY6ZbSaOvKPPnSLk";

  var doBuscarRutasCercanas = function(ptoInicio, ptoFin) {
    var i_lng = $scope.markerInicio.position.lng();
    var i_lat = $scope.markerInicio.position.lat();
    var f_lng = $scope.markerFin.position.lng();
    var f_lat = $scope.markerFin.position.lat();
    var rpta = [];
    var rpta1 = [];
    var rpta2 = [];
    for(var i in $scope.dataCompanies.data) {
      for(var j in $scope.dataCompanies.data[i].routeIda) {
        var pto = $scope.dataCompanies.data[i].routeIda[j];
        var d1 = getDistanceFromLatLonInKm(i_lat, i_lng, pto.lat, pto.lng);
        var d2 = getDistanceFromLatLonInKm(f_lat, f_lng, pto.lat, pto.lng);
        if (d1 < CONFIG.MAX_DISTANCE) {
          if (rpta1.indexOf(i) === -1){
            rpta1.push(i);
          }
        }
        if (d2 < CONFIG.MAX_DISTANCE) {
          if (rpta2.indexOf(i) === -1){
            rpta2.push(i);
          }
        }
      }
    }
    for(var aux1 in rpta1){
      if (rpta2.indexOf(rpta1[aux1]) !== -1){
        rpta.push(rpta1[aux1]);
      }
    }
    // console.log(rpta1);
    // console.log(rpta2);
    // console.log(rpta);
    return  rpta;
  }

  $scope.buscarRutasCercanas = function() {
    for(var i in $scope.dataCompanies.data) {
      $scope.dataCompanies.data[i].isChecked = false;
      $scope.showRoute($scope.dataCompanies.data[i]);
    }
    var rutasCercanas = doBuscarRutasCercanas();
    for(var i=0; i<rutasCercanas.length; i++) {
      var aux = parseInt(rutasCercanas[i]);
      var obj = $scope.rutasPolyline[aux];
      obj.ruta.setMap($scope.map);
      $scope.dataCompanies.data[aux].isChecked = true;
    }
  };
  $scope.showVamos = function() {
    console.log("CCCC");
  }
  $scope.infoCompany = function(idCompany) {
    var obj = $scope.dataCompanies.data.find(o => o._id === idCompany);
    $scope.rutaSelected = obj;
    $('#infoEmpresaModal').modal('show');
  };

  $scope.showRoute = function(company) {
    var obj = $scope.rutasPolyline.find(o => o._id === company._id);
    if(company.isChecked) {
      obj.ruta.setMap($scope.map);
    }
    else {
      obj.ruta.setMap(null);
    }
  };

  $scope.generarRutas = function() {

    rutasData.getCompanies()
    .then(function(data) {
      $scope.message = data.length > 0 ? "" : "No locations found nearby";
      $scope.dataCompanies = data;
     })
    ,(function (e) {
      $scope.message = "Sorry, something's gone wrong, please try again later";
    });

    $scope.ptoInicio = {lat: -16.398519, lng: -71.536172};//plaza de armas

    $scope.waypts = [
      {location: new google.maps.LatLng(-16.412117, -71.486882), stopover: true},//bolognesi con el sol
      {location: new google.maps.LatLng(-16.413697, -71.497425), stopover: true},//san amrtin con el sol
      {location: new google.maps.LatLng(-16.415508, -71.497170), stopover: true},//san amrtin con cusco
      {location: new google.maps.LatLng(-16.414280, -71.498984), stopover: true},//marisacal cadtilla con cusco
      {location: new google.maps.LatLng(-16.397190, -71.525170), stopover: true},//la paz con munoz najar
      {location: new google.maps.LatLng(-16.398260, -71.526887), stopover: true},//la paz con ayacucho
    ];
    getCurrentPosition(function(ptoInicio){
      var map = new google.maps.Map(document.getElementById('map'), {zoom: 15,center: ptoInicio});
      var directionsDisplay = new google.maps.DirectionsRenderer();
      var directionsService = new google.maps.DirectionsService();
      var flightPlanCoordinates = [];
      var flightPath;
      var start = new google.maps.LatLng(-16.410757, -71.479827);
      var end = new google.maps.LatLng(-16.327389, -71.567637);
      var request = {
        origin: start,
        destination: end,
        waypoints: $scope.waypts,
        optimizeWaypoints: false,
        travelMode: google.maps.TravelMode.WALKING
      };
      var opcionesDireccion = {
        suppressMarkers: false,
        preserveViewport: true,
        polylineOptions: {
          strokeColor: 'red'
        }
      };

      directionsService.route(request, function(result, status) {
        if (status == google.maps.DirectionsStatus.OK) {
          directionsDisplay.setDirections(result);
          directionsDisplay.setOptions(opcionesDireccion);
          //
          directionsDisplay.setMap(map);
          //
          for(var i in result.routes[0].overview_path) {

            flightPlanCoordinates.push({lat: result.routes[0].overview_path[i].lat(), lng: result.routes[0].overview_path[i].lng()});
            // console.log('{"lat": ' + result.routes[0].overview_path[i].lat() + ', "lng": ' + result.routes[0].overview_path[i].lng() + '},');
          }
          flightPath = new google.maps.Polyline({
            path: flightPlanCoordinates,
            geodesic: true,
            strokeColor: '#000000',
            strokeOpacity: 1.0,
            strokeWeight: 2
          });
          console.log(flightPath);
          //
          // flightPath.setMap(map);
          //
          //LISTENER EVEMT CLICK--NO USADO
          // flightPath.addListener('click', showModalRouteSelected);
          // google.maps.event.addListener(flightPath, 'click', showModalRouteSelected);
        } else {
          alert("couldn't get directions:" + status);
        }
      });


      map.addListener('click', function() {
        // $('#myModal').modal('show');
      });
    });


  };

  $scope.cargarRutas = function() {
    console.log($scope.contact);
    $('#recomendacionModal').modal('show');
    rutasData.getCompanies()
      .then(function(data) {
        $scope.message = data.length > 0 ? "" : "No locations found nearby";
        $scope.dataCompanies = data;

        getCurrentPosition(function(ptoInicio){
          $scope.map = new google.maps.Map(document.getElementById('map'), {zoom: 15,center: ptoInicio});

          var directionsDisplay = new google.maps.DirectionsRenderer();
          var directionsService = new google.maps.DirectionsService();

          $scope.rutasPolyline = [];
          for(var i in $scope.dataCompanies.data) {
            $scope.dataCompanies.data[i].isChecked = false;
            var rutaAux = new google.maps.Polyline({
              path: $scope.dataCompanies.data[i].routeIda,
              geodesic: true,
              strokeColor: colors[i%colors.length],
              strokeOpacity: 1.0,
              strokeWeight: 2
            });
            $scope.rutasPolyline.push({ruta:rutaAux, _id: $scope.dataCompanies.data[i]._id});
          }
          $scope.markerInicio = new google.maps.Marker({
            position: ptoInicio,
            map: $scope.map,
            draggable:true,
            label: 'A',
            title: 'Seleccione inicio ruta'
          });
          var positionB = ptoInicio;
          positionB.lat = ptoInicio.lat + 0.0008;
          positionB.lng = ptoInicio.lng + 0.0008;
          $scope.markerFin = new google.maps.Marker({
            position: positionB,
            map: $scope.map,
            draggable:true,
            label: 'B',
            title: 'Seleccione fin ruta'
          });
          // for(var i in $scope.rutasPolyline) {
          //   $scope.rutasPolyline[i].ruta.setMap($scope.map);
          // }

          // var flightPath = new google.maps.Polyline({
          //   path: $scope.dataCompanies.data[0].routeIda,
          //   geodesic: true,
          //   strokeColor: '#000000',
          //   strokeOpacity: 1.0,
          //   strokeWeight: 2
          // });
          // var flightPath2 = new google.maps.Polyline({
          //   path: $scope.dataCompanies.data[1].routeIda,
          //   geodesic: true,
          //   strokeColor: '#00FF00',
          //   strokeOpacity: 1.0,
          //   strokeWeight: 2
          // });

          // flightPath.setMap(map);
          // flightPath2.setMap(map);

        });
      }),
      (function (e) {
        $scope.message = "Sorry, something's gone wrong, please try again later";
      }
      );

    $scope.ptoInicio = {lat: -16.398519, lng: -71.536172};//plaza de armas

  };


  $scope.cargarRestaurant = function() {
    var vm = {};
    vm.ptoInicio = {lat: -16.398519, lng: -71.536172};//plaza de armas
    var styles = {
      default: null,
      hide: [
        {
          featureType: 'poi.business',
          stylers: [{visibility: 'off'}]
        },
        {
          featureType: 'transit',
          elementType: 'labels.icon',
          stylers: [{visibility: 'off'}]
        }
      ]
    };
    vm.map = new google.maps.Map(document.getElementById('map'), {
      zoom: 18,center: vm.ptoInicio, mapTypeControl: false, fullscreenControl: false});
    vm.map.setOptions({styles: styles['hide']})

    var infowindow = new google.maps.InfoWindow({
      content: ''
    });

    var marcadores = [
      {
        position:{
          lat : -16.3986425 ,
          lng : - 71.5357409
        },
        contenido:
          "<div id=\"content\" class=\"modal-body letraNegra\">"+
            "<h2>Restaurante Capriccio</h2>"+
            "<br>" +
            "<div id=\"bodyContent\">" +
              "<p><b>Teléfono: </b>(054) 391000</p>" +
              "<p><b>Horarios: </b>Lunes – Domingo (8 – 22 horas)</p>" +
              "<p><b>Descripción: </b>Un espacio acogedor en el que los amantes de la pastelería encontrarán una variada carta de postres, tortas, bebidas y mucho más. Uno de los locales del Restaurante Capriccio de Arequipa está en la Calle Mercaderes. Por su ubicación cercana a la Plaza de Armas de la ciudad, es un lugar adecuado para visitar durante tus salidas casuales junto a tus amigos. Aquí podrás degustar de ricas tortas y también bebidas para alegrar la noche o el fin de semana.</p>" +
            "</div>" +
          "</div>"
      },
      {
        position:{
          lat : -16.3991198,
          lng : - 71.5359132
        },
        contenido:
          "<div id=\"content\" class=\"modal-body letraNegra\">"+
            "<h2>KFC</h2>"+
            "<div id=\"bodyContent\">" +
              "<br>" +
              "<p><b>Teléfono: </b>(054) 281988</p>" +
              "<p><b>Horarios: </b>Lunes – Domingo (10 – 22 horas)</p>" +
              "<p><b>Descripción: </b>Cadena de comida rápida conocida por sus cubos de pollo frito que también sirve alitas y acompañamientos.</p>" +
            "</div>" +
          "</div>"
      },
      {
        position:{
          lat : -16.3996013,
          lng : - 71.5328897
        },
        contenido:
          "<div id=\"content\" class=\"modal-body letraNegra\">"+
            "<h2>Pizzería Presto</h2>"+
            "<br>" +
            "<div id=\"bodyContent\">" +
              "<p><b>Teléfono: </b>(054) 381-111</p>" +
              "<p><b>Horarios: </b>Domingo a jueves de 12pm a 10:30pm y viernes y sábado de 12:00pm a 11:30pm</p>" +
              "<p><b>Descripción: </b>Somos la cadena peruana de restaurantes casuales de comida italiana casera más grande del sur del país. Brindamos a nuestros clientes experiencias deliciosas a través de un servicio amigable. Nos preocupamos por el desarrollo personal de nuestros colaboradores, la sociedad y el medio ambiente.</p>" +
            "</div>" +
          "</div>"
      },
      {
        position:{
          lat : -16.3993419,
          lng : - 71.5339807
        },
        contenido:
          "<div id=\"content\" class=\"modal-body letraNegra\">"+
            "<h2>Chifa Mandarin</h2>"+
            "<br>" +
            "<div id=\"bodyContent\">" +
              "<p><b>Teléfono: </b>(054) 281988</p>" +
              "<p><b>Horarios: </b>Lunes – Domingo (12 – 22 horas)</p>" +
              "<p><b>Descripción: </b>Ven y disfruta de la mejor comida cantonesa y de los diferentes combinados.</p>" +
            "</div>" +
          "</div>"
      },
      {
        position:{
          lat : -16.3986717,
          lng : - 71.5354609
        },
        contenido:
          "<div id=\"content\" class=\"modal-body letraNegra\">"+
            "<h2>Pura Fruta</h2>"+
            "<br>" +
            "<div id=\"bodyContent\">" +
              "<p><b>Teléfono: </b>(054) 231849</p>" +
              "<p><b>Horarios: </b>Lunes – Sabado (8:30 – 22 horas), Domingo(7:30-13:30 horas)</p>" +
              "<p><b>Descripción: </b>Es un restaurant con un tipo de cocina Peruana muy saludable, donde puedes compartir desayunos, brunch y bebidas, es un lugar bastante acogedor donde puedes ir con tus niños hasta familias enteras para compartir un bonito momento.</p>" +
            "</div>" +
          "</div>"
      },
      {
        position:{
          lat : -16.3984993,
          lng : - 71.5360859
        },
        contenido:
          "<div id=\"content\" class=\"modal-body letraNegra\">"+
            "<h2>McDonald’s</h2>"+
            "<br>" +
            "<div id=\"bodyContent\">" +
              "<p><b>Teléfono: </b>(054) 231849</p>" +
              "<p><b>Horarios: </b>Lunes – Sabado (8:30 – 22 horas), Domingo(7:30-13:30 horas)</p>" +
              "<p><b>Descripción: </b>Veterana cadena de comida rápida famosa por sus hamburguesas, patatas fritas y bebidas, con opción de menús.</p>" +
            "</div>" +
          "</div>"
      }
    ];
    for (var i = 0, j = marcadores.length; i < j; i++) {
      var contenido = marcadores[i].contenido;
      var marker = new google.maps.Marker({
        position: new google.maps.LatLng(marcadores[i].position.lat, marcadores[i].position.lng),
        map: vm.map
      });
      (function(marker, contenido){
        google.maps.event.addListener(marker, 'click', function() {
          infowindow.setContent(contenido);
          infowindow.open(map, marker);
        });
      })(marker,contenido);
    }

  };
};



var rutasData = function ($http) {
  var getCompanies = function () {
    return $http.get('/api/company');
  };
  return {
    getCompanies : getCompanies
  };
};

angular
  .module('rutasApp')
  .controller('myControllerCtrl', ['$scope', 'rutasData', 'CONFIG', myControllerCtrl])
  .service('rutasData', rutasData)
  .constant('CONFIG', {
    APIURL: "http:apiurl.com/api",
    MAX_DISTANCE: 0.5,
  });
