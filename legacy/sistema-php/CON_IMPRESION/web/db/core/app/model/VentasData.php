<?php
class VentasData {
	public static $tablename = "ventas";

	public function VentasData(){

	
	}

	public function getCliente(){ return ClientesData::getById($this->codcliente);}




	public static function getById($id){
		$sql = "select * from ".self::$tablename." where codventa=\"$id\"";
		$query = Executor::doit($sql);
		return Model::one($query[0],new VentasData());

	}


	public static function getAll(){
		$sql = "select * from ".self::$tablename;
		$query = Executor::doit($sql);
		return Model::many($query[0],new VentasData());
	} 

	public static function getIngresoRangoFechasFactura($start,$end){
		$sql = "select * from ".self::$tablename." where  date(fechaventa) >= \"$start\" and date(fechaventa) <= \"$end\" and  aceptado='Aceptada'   ";
		$query = Executor::doit($sql);
		return Model::many($query[0],new VentasData());
	}







}

?>