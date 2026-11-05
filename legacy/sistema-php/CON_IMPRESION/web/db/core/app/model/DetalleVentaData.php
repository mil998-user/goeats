<?php
class DetalleVentaData {
	public static $tablename = "detalleventas";



	public function DetalleVentaData(){
		
		
	}
	public function getVenta(){ return VentaData::getById($this->codventa);}
	
	public function add(){
		$sql = "insert into detalleventas (codventa,codcliente,codproducto,producto,codcategoria,cantventa,preciocompra,precioventa,ivaproducto,importe,importe2,fechadetalleventa,statusdetalle,codigo,comanda) ";
		$sql .= "value (\"$this->codventa\",\"$this->codcliente\",\"$this->codproducto\",\"$this->producto\",\"$this->codcategoria\",\"$this->cantventa\",\"$this->preciocompra\",\"$this->precioventa\",\"$this->ivaproducto\",\"$this->importe\",\"$this->importe2\",\"$this->fechadetalleventa\",\"$this->statusdetalle\",\"$this->codigo\",\"$this->comanda\")";
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

 
	public static function getById($id){
		$sql = "select * from ".self::$tablename." where id=$id";
		$query = Executor::doit($sql); 
		return Model::one($query[0],new DetalleVentaData());

	}

	
	public static function getAll(){
		$sql = "select * from ".self::$tablename;
		$query = Executor::doit($sql);
		return Model::many($query[0],new DetalleVentaData());
	}
	
	


}

?>