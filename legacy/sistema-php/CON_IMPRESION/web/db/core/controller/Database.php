<?php

class Database {
	public static $db;
	public static $con;
	public static $con1;
	
	function Database(){
		$this->user="root";$this->pass="";$this->host="localhost";$this->ddbb="restofe2023";
		
	} 

	
    
 
 	

	function connect(){
		$con = new mysqli($this->host,$this->user,$this->pass,$this->ddbb);
		$con->query("set sql_mode=''");
		return $con;
	}



	
	public static function Conectar()
    {        
        try
			{
				$conexionn = new PDO('mysql:host=localhost;dbname=restord;charset=utf8', 'root', '');
	        	$conexionn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);	
	        	return $conexionn;  
			}
				catch(Exception $e)
			{
				die($e->getMessage());
			}
    }

 
	function connect1(){
		$db = new PDO("mysql:host=$this->host;",$this->user,$this->pass);
		$db->exec("use `$this->ddbb`");
		return $db;	
	} 

	public static function getCon(){
		if(self::$con==null && self::$db==null){
			self::$db = new Database();
			self::$con = self::$db->connect();
		}
		return self::$con;
	}

	
}





?>
