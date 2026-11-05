<?php
class CategoriasData {
	public static $tablename = "tm_producto_catg";

	public function CategoriasData(){

	
	}



	public static function getById($id){
		$sql = "select * from ".self::$tablename." where id_catg=$id";
		$query = Executor::doit($sql);
		return Model::one($query[0],new CategoriasData());

	}


	public static function getAll(){
		$sql = "select * from ".self::$tablename;
		$query = Executor::doit($sql);
		return Model::many($query[0],new CategoriasData());
	} 




}

?>