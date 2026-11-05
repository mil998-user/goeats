<?php
class CarritoData {
	public static $tablename = "tm_carrito";



	public function CarritoData(){
		$this->cantidad = "";
		$this->precio = "";
		
	}
	public function getProducto(){ return ProductoData::getById($this->id_producto);}
	
	public function add(){
		$sql = "insert into tm_carrito (id_producto,cantidad,precio) ";
		$sql .= "value (\"$this->id_producto\",\"$this->cantidad\",\"$this->precio\")";
		Executor::doit($sql);
	}

	public function addTmp(){
		$sql = "insert into tm_carrito (id_producto,cantidad,precio,sessionn_id,opciones) ";
		$sql .= "value (\"$this->id_producto\",\"$this->cantidad\",\"$this->precio\",\"$this->sessionn_id\",\"$this->opciones\")";
		Executor::doit($sql);
	}



	public static function delById($id){
		$sql = "delete from ".self::$tablename." where id=$id";
		Executor::doit($sql);
	}
	public function del(){
		$sql = "delete from ".self::$tablename." where id=$this->id";
		Executor::doit($sql);
	}

// partiendo de que ya tenemos creado un objecto UserData previamente utilizamos el contexto



 	public function updateCantidad(){
		$sql = "update ".self::$tablename." set cantidad=\"$this->cantidad\",opciones=\"$this->opciones\" where id=$this->id";
		Executor::doit($sql);
	}
 
	public static function getById($id){
		$sql = "select * from ".self::$tablename." where id=$id";
		$query = Executor::doit($sql); 
		return Model::one($query[0],new CarritoData());

	}

	public static function getByIdProducto($id){
		$sql = "select * from ".self::$tablename." where id_producto=$id";
		$query = Executor::doit($sql);
		return Model::one($query[0],new CarritoData());

	}
	
	public static function getByIdProductoSession($id,$session){
		$sql = "select * from ".self::$tablename." where id_producto=$id and sessionn_id=\"$session\"";
		$query = Executor::doit($sql);
		return Model::one($query[0],new CarritoData());

	}

	
	public static function getAll(){
		$sql = "select * from ".self::$tablename;
		$query = Executor::doit($sql);
		return Model::many($query[0],new CarritoData());
	}
	
	public static function getAllTemporal($id_session){
		$sql = "select * from ".self::$tablename." where sessionn_id=\"$id_session\" ";
		$query = Executor::doit($sql);
		return Model::many($query[0],new CarritoData());
	}

	public static function getAllTemporalStock($id_session){
		$sql = "select * from ".self::$tablename." where sessionn_id=\"$id_session\"  group by id_producto ";
		$query = Executor::doit($sql);
		return Model::many($query[0],new CarritoData());
	}

	public static function getAllTemporalCompra($id_session){
		$sql = "select * from ".self::$tablename." where sessionn_id=\"$id_session\" and tipo_operacion=2 ";
		$query = Executor::doit($sql);
		return Model::many($query[0],new CarritoData());
	}
	


}

?>