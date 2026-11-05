<?php
class ReservaData {
	public static $tablename = "reservas";

	public function ReservaData(){

	
	}

	public function getCliente(){ return ClientesData::getById($this->id_cliente);}

	public function add(){
		$sql = "insert into reservas (id_cliente,cantidad,fecha,mensaje) ";
		$sql .= "value (\"$this->id_cliente\",\"$this->cantidad\",\"$this->fecha\",\"$this->mensaje\")";
		Executor::doit($sql);
	}

	public function del(){
		$sql = "delete from ".self::$tablename." where id=$this->id";
		Executor::doit($sql);
	}



	public static function getById($id){
		$sql = "select * from ".self::$tablename." where id=$id";
		$query = Executor::doit($sql);
		return Model::one($query[0],new ReservaData());

	}


	public static function getAll(){
		$sql = "select * from ".self::$tablename;
		$query = Executor::doit($sql);
		return Model::many($query[0],new ReservaData());
	} 




}

?>