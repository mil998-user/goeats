<?php
class ConfiguracionData {
	public static $tablename = "configuracion";

	public function ConfiguracionData(){

	
	}




	public static function getById($id){
		$sql = "select * from ".self::$tablename." where codventa=\"$id\"";
		$query = Executor::doit($sql);
		return Model::one($query[0],new ConfiguracionData());

	}

	public static function getAllConfiguracion(){
		$sql = "select * from ".self::$tablename." limit 1";
		$query = Executor::doit($sql);
		return Model::one($query[0],new ConfiguracionData());
	}



	public static function getAll(){
		$sql = "select * from ".self::$tablename;
		$query = Executor::doit($sql);
		return Model::many($query[0],new ConfiguracionData());
	}







}

?>