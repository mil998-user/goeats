<?php


/// en caso de que el parametro action este definido evitamos que se muestre
/// el layout por defecto y ejecutamos el action sin mostrar nada de vista
// print_r($_GET);
if(!isset($_GET["action"])){
//	Bootload::load("default");
	Module::loadLayout("index");
	date_default_timezone_set('America/Lima');
}else{
	Action::load($_GET["action"]);
	date_default_timezone_set('America/Lima');
}

?>