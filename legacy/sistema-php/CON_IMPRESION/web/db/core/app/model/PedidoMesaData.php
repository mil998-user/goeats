<?php
class PedidoMesaData {
	public static $tablename = "tm_pedido_mesa";



	public function PedidoMesaData(){
		
		
	}
	//public function getCliente(){ return ClientesData::getById($this->codcliente);}
	
	public function add(){
		$sql = "insert into tm_pedido_mesa (id_pedido,id_mesa,id_mozo,nomb_cliente,nro_personas,comentario) ";
		$sql .= "value (\"$this->id_pedido\",\"$this->id_mesa\",\"$this->id_mozo\",\"$this->nomb_cliente\",\"$this->nro_personas\",\"$this->comentario\")";
		return Executor::doit($sql);
	}

	public static function delById($id){
		$sql = "delete from ".self::$tablename." where id_pedido=$id";
		Executor::doit($sql);
	}
	public function del(){
		$sql = "delete from ".self::$tablename." where id_pedido=$this->id_pedido";
		Executor::doit($sql);
	}

// partiendo de que ya tenemos creado un objecto UserData previamente utilizamos el contexto

 
	public static function getById($id){
		$sql = "select * from ".self::$tablename." where id_pedido=$id";
		$query = Executor::doit($sql); 
		return Model::one($query[0],new PedidoMesaData());

	}

	

	
	public static function getAll(){
		$sql = "select * from ".self::$tablename;
		$query = Executor::doit($sql);
		return Model::many($query[0],new PedidoMesaData());
	}
	
	


}

?>