<?php
class UserData {
	public static $tablename = "tm_usuario";



	public function UserData(){
		
		
	}
	
 
	
	public static function getUltimoProcess(){
		$sql = "select * from ".self::$tablename." where id_rol=4 order by id_usu desc limit 1 ";
		$query = Executor::doit($sql);
		return Model::one($query[0],new UserData());

	}

	

	
	public static function getAll(){
		$sql = "select * from ".self::$tablename;
		$query = Executor::doit($sql);
		return Model::many($query[0],new UserData());
	}
	
	


}

?>