<?php
class ProductoData {
	public static $tablename = "tm_producto_pres";

	public function ProductoData(){

	
	}

	

	public static function getById($id){
		$sql = "select * from ".self::$tablename." where id_pres=$id";
		$query = Executor::doit($sql);
		return Model::one($query[0],new ProductoData());

	}


	public static function getAll(){
		$sql = "select * from ".self::$tablename;
		$query = Executor::doit($sql);
		return Model::many($query[0],new ProductoData());
	} 

	public static function getBycategoria($id){
		$sql = "select pre.id_pres, pre.id_prod, pre.cod_prod, pre.presentacion, pre.precio, pre.imagen, pre.estado, pre.opciones  from tm_producto_pres as pre  
		inner join tm_producto as pro on pro.id_prod=pre.id_prod 
		inner join tm_producto_catg as cat on cat.id_catg=pro.id_catg 
		where pro.id_catg=$id ";
		$query = Executor::doit($sql);
		return Model::many($query[0],new ProductoData());
	} 




}

?>