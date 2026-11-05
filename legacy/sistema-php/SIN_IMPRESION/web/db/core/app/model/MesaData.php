<?php
class MesaData {
	public static $tablename = "tm_mesa";

	public function MesaData(){

	
	}

	public function update(){
		$sql = "update ".self::$tablename." set estado=\"$this->estado\" where id_mesa=$this->id_mesa";
		Executor::doit($sql);
	}

	

	public static function getById($id){
		$sql = "select * from ".self::$tablename." where id_mesa=$id";
		$query = Executor::doit($sql);
		return Model::one($query[0],new MesaData());

	}

	


}

?>