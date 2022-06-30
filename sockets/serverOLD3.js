const express= require('express');
const path=require('path');
const bodyParser = require('body-parser');
const app= express();
const mysql = require('mysql');
require("dotenv").config();
/*var jsonParser=bodyParser.json();
var urlencodedParser=bodyParser.urlencoded({extended:false});*/
app.use(bodyParser.urlencoded({extended: false}));
app.set('view engine', 'ejs');
//app.set("views", __dirname + "/public");
//conexion mysql
/*const connection = mysql.createConnection({
   host:"us-cdbr-east-05.cleardb.net",
   user:"bcb35076ea6099",
   password: "75e8c1a7",
   database: "heroku_95b754d0cb81981",
   
});*/

const connection = mysql.createConnection({
   host:"localhost",
   user:"root",
   password: "123456789",
   database: "ruletasuerte",
});

connection.connect((err)=>{
   if(err) throw err;
   console.log("Conectado a la base ");
})
//consultas mysql 
const {insert,read}= require('../public/js/consultasMysql');
//const {recibirDatos,semaforo}= require('../public/js/main');
//insertar datos
app.post("/insert",(req,res)=>{
   let pin=req.body.pin;
   console.log(pin);
   let frase=req.body.frase;
   insert(connection,{maxJugadores:3,cantJugadores:0,pinAcceso:pin,turnoJugador:0,ganador:0,Frase:frase},(result)=>{
        //res.json(result);
        res.render('../public/partida',{PIN:pin});
        console.log(result);
       
   });

});


//leer datos
var datosPartida={};
app.post("/read",(req,res)=>{
   console.log(req.body.pin);
   let pin=req.body.pin;
   let alias=req.body.alias;
   read(
      connection,{PIN:pin,jugador:alias},(result)=>{
         //res.json(result);
         //res.render("juego");
         if(result=="partida llena"||result=="partida inexistente"){
            //res.redirect('http://localhost:3000/llena.html');
            res.render('../public/llena');
         }else{
            console.log(result);
            datosPartida=result;
            //console.log(datosPartida);
            //recibirDatos(result);
            //res.redirect('http://localhost:3000/juego.html');
            
            res.render('../public/juego');
         }

      }
   );
})

const http = require('http');

const port = process.env.PORT || 3000;
const server = http.createServer(app);

server.listen(port);

app.use(express.static('public'));
app.get('/',function(req,res){
   res.render('../public/index');
});
app.get('/menu2',function(req,res){
   res.render('../public/menu2');

});
app.get('/instrucciones',function(req,res){
   res.render('../public/instrucciones');

});app.get('/buscarPartida',function(req,res){
   res.render('../public/buscarPartida');

});app.get('/crearPartida',function(req,res){
   res.render('../public/crearPartida');
});
console.log('servidor en puerto: '+port);
const sockerIo = require('socket.io');
const Connection = require('mysql/lib/Connection');
const io = require('socket.io')(server);

var listaJugadores=[];
var frases;

io.on('connect',function(socket){

   //se agrega el nuevo jugador con su id a la lista de jugadores
   socket.on("nuevoJugador", function(){
      console.log("se unio un jugador: " + socket.id);
      listaJugadores.push(socket.id).idUsuario;
      console.log("lista de jugadores "+ listaJugadores.length);
      io.emit("listaJugadores",{lista:listaJugadores});
      io.emit("pasoFrases",datosPartida.Frases);
      console.log(" ");
      console.log("USUARIOS CONECTADOS");
      for( var i =0; i < listaJugadores.length ; i++){
         console.log("jugador "+ i+": "+listaJugadores[i]);

      };


      /*var {recibirDatos}= require('../public/js/main');
      recibirDatos(datosPartida);*/
      
   });

   //tomams la lista de palabras 
   socket.on("listaPalabras", function(dato){
      frases= dato;
      for( var i =0; i < frases.length ; i++){
         console.log("frase: "+ frases[i]);

      };
      io.emit("listaPalabras",frases);
   })

   

   //nos fijamos quien comenzo partida
   socket.on("comenzoPartida", function(dato){
      console.log(" ");
      console.log("el jugador: " +dato+ " comenzo partida.");
      io.emit("comenzoPartida",dato);
      
   });
  

   //la palabra a mostrar
   socket.on("actualizoPantalla", function(datos){
      console.log("la palabra a adivinar es"+ datos.palabraAdivinar);
      io.emit("actualizoPantalla", {palabraMostrar:datos.palabraMostrar, palabraAdivinar:datos.palabraAdivinar,turno:datos.turno,puntuacionJ1: datos.puntuacionJ1,puntuacionJ2: datos.puntuacionJ2,puntuacionJ3: datos.puntuacionJ3});
   });
   

   //mando la frase de la ventana
   socket.on("fraseVentana", function(dato){
      io.emit("fraseVentana",dato);
   });

   
   //nos fijamos de quien es el turno actual
   socket.on("turno", function(dato){
      console.log("es el turno del jugador numero" + dato.jugador);
      io.emit("turno",dato.jugador);
      io.to(listaJugadores[dato.jugador]).emit('habilitar',dato.jugador);
    
   });
  

   
   
 
  socket.on("rotateWhel",function(datos){
    io.emit("rotateWhel",{spinAngleStart:datos.spinAngleStart,spinTime:datos.spinTime,spinTimeTotal:datos.spinTimeTotal});
  });

  //habilitar teclado

  socket.on("habilitarTeclado",function(dato){
     io.to(listaJugadores[dato]).emit("habilitarTeclado",dato);
  })
   //eliminamos al usuario de la lista de usuarios cuando se desconecta

   socket.on('disconnect',function(){
      idUsuario= socket.id;
      for (var i = 0; i < listaJugadores.length; i++) {
         if(listaJugadores[i]== idUsuario){
            listaJugadores.splice(i,1);
           var  jugador= i;
            console.log("encontrado.");
         }
      }

      console.log("usuario " + idUsuario + " desconectandose...");
      io.emit("usuarioDesconectado",(jugador+1));
      console.log(" ");

      console.log("USUARIOS CONECTADOS ACTUALES:");
      for( var i =0; i < listaJugadores.length ; i++){
         console.log(listaJugadores[i]);

      }

   });

   
  
});
