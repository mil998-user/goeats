<?php
class ClientesData {
	public static $tablename = "tm_cliente";

	public function ClientesData(){

	
	}

 
	public function add(){
		$sql = "insert into tm_cliente (dni,ape_paterno,ape_materno,nombres,telefono,correo,direccion,password) ";
		$sql .= "value (\"$this->dni\",\"$this->ape_paterno\",\"$this->ape_materno\",\"$this->nombres\",\"$this->telefono\",\"$this->correo\",\"$this->direccion\",\"$this->password\")";
		Executor::doit($sql);
	}

	public function addCliente(){
		$sql = "insert into tm_cliente (dni,ape_paterno,ape_materno,nombres,telefono,fecha_nac,correo,direccion,password) ";
		$sql .= "value (\"$this->dni\",\"$this->ape_paterno\",\"$this->ape_materno\",\"$this->nombres\",\"$this->telefono\",\"$this->fecha_nac\",\"$this->correo\",\"$this->direccion\",\"$this->password\")";
		Executor::doit($sql);
	}

	public function updateCantidad(){
		$sql = "update ".self::$tablename." set estado=\"$this->estado\" where id_cliente=$this->id_cliente";
		Executor::doit($sql);
	}

	public function update(){
		$sql = "update ".self::$tablename." set dni=\"$this->dni\",nombres=\"$this->nombres\",telefono=\"$this->telefono\",direccion=\"$this->direccion\",password=\"$this->password\" where id_cliente=$this->id_cliente";
		Executor::doit($sql);
	}

	

	public static function getById($id){
		$sql = "select * from ".self::$tablename." where id_cliente=$id";
		$query = Executor::doit($sql);
		return Model::one($query[0],new ClientesData());

	}

	public static function getByEmail($id){
		$sql = "select * from ".self::$tablename." where correo=\"$id\"";
		$query = Executor::doit($sql);
		return Model::one($query[0],new ClientesData());

	}

 
	public static function getAll(){
		$sql = "select * from ".self::$tablename;
		$query = Executor::doit($sql);
		return Model::many($query[0],new ClientesData());
	} 




}

?>