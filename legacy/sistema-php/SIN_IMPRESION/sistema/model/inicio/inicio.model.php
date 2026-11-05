<?php
include_once("model/rest.model.php");

class InicioModel
{
    private $conexionn;

    public function __CONSTRUCT()
    {
        try
        {
            $this->conexionn = Database::Conectar();
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }

    public function ListarCM()
    {
        try
        {      
            $stm = $this->conexionn->prepare("SELECT * FROM tm_salon WHERE estado <> 'i'");
            $stm->execute();            
            $c = $stm->fetchAll(PDO::FETCH_OBJ);
            $stm->closeCursor();
            return $c;
            $this->conexionn=null;
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }

    public function ListarMesa()
    {
        try
        {   
            $stm = $this->conexionn->prepare("SELECT * FROM v_listar_mesas");
            $stm->execute();            
            $c = $stm->fetchAll(PDO::FETCH_OBJ);
            $stm->closeCursor();
            return $c;
            $this->conexionn=null;
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }

    public function ListarMostrador()
    {
        try
        {   
            $stm = $this->conexionn->prepare("SELECT tp.*,p.fecha_pedido,p.estado FROM tm_pedido AS p INNER JOIN tm_pedido_llevar AS tp ON p.id_pedido = tp.id_pedido WHERE p.estado <> 'i' AND p.estado <> 'c'");
            $stm->execute();
            $c = $stm->fetchAll(PDO::FETCH_OBJ);
            foreach($c as $k => $d)
            {
                $c[$k]->{'Total'} = $this->conexionn->query("SELECT IFNULL(SUM(precio*cantidad),0) AS total FROM v_det_llevar WHERE estado <> 'i' AND id_pedido = " . $d->id_pedido)
                    ->fetch(PDO::FETCH_OBJ);
            }
            $stm->closeCursor();
            return $c;
            $this->conexionn=null;
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }

    public function ListarDelivery()
    {
        try
        {   
            $stm = $this->conexionn->prepare("SELECT tp.*,p.fecha_pedido,p.estado,DATE(p.fecha_pedido) AS fecha FROM tm_pedido AS p INNER JOIN tm_pedido_delivery AS tp ON p.id_pedido = tp.id_pedido WHERE p.estado <> 'i' AND p.estado <> 'c'");
            $stm->execute();
            $c = $stm->fetchAll(PDO::FETCH_OBJ);
            foreach($c as $k => $d)
            {
                $c[$k]->{'Total'} = $this->conexionn->query("SELECT IFNULL(SUM(precio*cantidad),0) AS total FROM v_det_delivery WHERE estado <> 'i' AND id_pedido = " . $d->id_pedido)
                    ->fetch(PDO::FETCH_OBJ);
            }
            $stm->closeCursor();
            return $c;
            $this->conexionn=null;
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }

    public function DatosGrles($data)
    {
        try
        {   
            if($data['tp'] == 1){ $tabla = 'v_pedido_mesa'; } elseif($data['tp'] == 2) { $tabla = 'v_pedido_llevar'; } elseif($data['tp'] == 3) { $tabla = 'v_pedido_delivery'; }
            $stm = $this->conexionn->prepare("SELECT * FROM ".$tabla." WHERE id_pedido = ?");
            $stm->execute(array($data['cod']));
            $c = $stm->fetch(PDO::FETCH_OBJ);
            /* Traemos el detalle */
            $c->{'Detalle'} = $this->conexionn->query("SELECT SUM(cantidad) AS cantidad, precio, comentario, estado FROM tm_detalle_pedido WHERE id_pedido = ".$c->id_pedido." AND estado <> 'i' GROUP BY id_pres ORDER BY fecha_pedido DESC")
                ->fetchAll(PDO::FETCH_OBJ);
            return $c;
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }

    public function listarPedidos()
    {
        try
        {   
            $stm = $this->conexionn->prepare("SELECT id_pedido,id_pres,SUM(cantidad) AS cantidad, precio, comentario, estado FROM tm_detalle_pedido WHERE id_pedido = ? AND estado <> 'i' AND cantidad > 0 GROUP BY id_pres ORDER BY fecha_pedido DESC");
            $stm->execute(array($_POST['cod']));
            $c = $stm->fetchAll(PDO::FETCH_OBJ);  
            foreach($c as $k => $d)
            {
                $c[$k]->{'Producto'} = $this->conexionn->query("SELECT nombre_prod,pres_prod FROM v_productos WHERE id_pres = ". $d->id_pres)
                    ->fetch(PDO::FETCH_OBJ);
            }
            $stm->closeCursor();
            return $c;
            $this->conexionn=null;
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }

    public function listarCategorias()
    {
        try
        {   
            $stm = $this->conexionn->prepare("SELECT * FROM tm_producto_catg");
            $stm->execute();
            $c = $stm->fetchAll(PDO::FETCH_OBJ);
            $stm->closeCursor();
            return $c;
            $this->conexionn=null;
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }

    public function listarProdsMasVend()
    {
        try
        {   
            $stm = $this->conexionn->prepare("SELECT p.id_areap,p.id_pres,p.nombre_prod,p.pres_prod,p.precio,p.imagen FROM tm_detalle_venta AS dv INNER JOIN v_productos AS p ON dv.id_prod = p.id_pres WHERE estado = 'a' GROUP BY dv.id_prod ORDER BY SUM(cantidad) DESC LIMIT 0 , 5");
            $stm->execute();
            $c = $stm->fetchAll(PDO::FETCH_OBJ);
            foreach($c as $k => $d)
            {
                $c[$k]->{'Impresora'} = $this->conexionn->query("SELECT i.nombre FROM tm_area_prod AS ap INNER JOIN tm_impresora AS i ON ap.id_imp = i.id_imp WHERE ap.id_areap = " . $d->id_areap)
                ->fetch(PDO::FETCH_OBJ);
            }
            $stm->closeCursor();
            return $c;
            $this->conexionn=null;
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }

    public function listarProductos($data)
    {
        try
        {   
            $stm = $this->conexionn->prepare("SELECT id_areap,id_pres,nombre_prod,pres_prod,precio,imagen FROM v_productos WHERE id_catg = ? AND estado = 'a'");
            $stm->execute(array($data['cod']));
            $c = $stm->fetchAll(PDO::FETCH_OBJ);
            foreach($c as $k => $d)
            {
                $c[$k]->{'Impresora'} = $this->conexionn->query("SELECT i.nombre FROM tm_area_prod AS ap INNER JOIN tm_impresora AS i ON ap.id_imp = i.id_imp WHERE ap.id_areap = " . $d->id_areap)
                ->fetch(PDO::FETCH_OBJ);
            }
            $stm->closeCursor();
            return $c;
            $this->conexionn=null;
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }

    public function BuscarProds($data)
    {
        try
        {   
            $stm = $this->conexionn->prepare("SELECT id_areap,id_pres,nombre_prod,pres_prod,precio,imagen FROM v_productos WHERE (cod_prod LIKE '%$data%' OR nombre_prod LIKE '%$data%') AND estado = 'a'");
            $stm->execute();
            $c = $stm->fetchAll(PDO::FETCH_OBJ);
            foreach($c as $k => $d)
            {
                $c[$k]->{'Impresora'} = $this->conexionn->query("SELECT i.nombre FROM tm_area_prod AS ap INNER JOIN tm_impresora AS i ON ap.id_imp = i.id_imp WHERE ap.id_areap = " . $d->id_areap)
                ->fetch(PDO::FETCH_OBJ);
            }
            $stm->closeCursor();
            return $c;
            $this->conexionn=null;
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }
    
    public function ObtenerDatosImp($data)
    {
        try
        {       
            $stm = $this->conexionn->prepare("SELECT * FROM v_ventas_con WHERE id_ped = ?");
            $stm->execute(array($data));
            $c = $stm->fetch(PDO::FETCH_OBJ);
            $c->{'Cliente'} = $this->conexionn->query("SELECT * FROM v_clientes WHERE id_cliente = ".$c->id_cli)
                ->fetch(PDO::FETCH_OBJ);

            
            /* Traemos el detalle */
            $c->{'Detalle'} = $this->conexionn->query("SELECT id_prod,SUM(cantidad) AS cantidad, precio FROM tm_detalle_venta WHERE id_venta = " . $c->id_ven." GROUP BY id_prod")
                ->fetchAll(PDO::FETCH_OBJ);
            foreach($c->Detalle as $k => $d)
            {
                $c->Detalle[$k]->{'Producto'} = $this->conexionn->query("SELECT nombre_prod, pres_prod FROM v_productos WHERE id_pres = " . $d->id_prod)
                    ->fetch(PDO::FETCH_OBJ);
            }
            return $c;
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }

    public function ObtenerDatosImpNota($data)
    {
        try
        {       
            $stm = $this->conexionn->prepare("SELECT * FROM v_ventas_con WHERE id_ped = ?");
            $stm->execute(array($data));
            $c = $stm->fetch(PDO::FETCH_OBJ);
            $c->{'Cliente'} = $this->conexionn->query("SELECT * FROM v_clientes WHERE id_cliente = ".$c->id_cli)
                ->fetch(PDO::FETCH_OBJ);

            $c->{'Tiraje'} = $this->conexionn->query("SELECT * FROM tm_tiraje WHERE idtiraje = ".$c->id_tiraje)
                ->fetch(PDO::FETCH_OBJ);
            /* Traemos el detalle */
            $c->{'Detalle'} = $this->conexionn->query("SELECT id_prod,SUM(cantidad) AS cantidad, precio FROM tm_detalle_venta WHERE id_venta = " . $c->id_ven." GROUP BY id_prod")
                ->fetchAll(PDO::FETCH_OBJ);
            foreach($c->Detalle as $k => $d)
            {
                $c->Detalle[$k]->{'Producto'} = $this->conexionn->query("SELECT nombre_prod, pres_prod FROM v_productos WHERE id_pres = " . $d->id_prod)
                    ->fetch(PDO::FETCH_OBJ);
            }
            return $c;
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }

    public function ObtenerDatosImpPC($data)
    {
        try
        {      
            $stm = $this->conexionn->prepare("SELECT * FROM v_pedido_mesa WHERE id_pedido = ?");
            $stm->execute(array($data));
            $c = $stm->fetch(PDO::FETCH_OBJ);
            /* Traemos el detalle */
            $c->{'Detalle'} = $this->conexionn->query("SELECT id_pres,SUM(cantidad) AS cantidad, precio FROM tm_detalle_pedido WHERE id_pedido = " . $c->id_pedido." AND estado <> 'i' GROUP BY id_pres")
                ->fetchAll(PDO::FETCH_OBJ);
            foreach($c->Detalle as $k => $d)
            {
                $c->Detalle[$k]->{'Producto'} = $this->conexionn->query("SELECT nombre_prod, pres_prod FROM v_productos WHERE id_pres = " . $d->id_pres)
                    ->fetch(PDO::FETCH_OBJ);
            }
            return $c;
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }

    public function ObtenerDatosImpComan($data,$pedido)
    {
        try
        {   
            $stm = $this->conexionn->prepare("SELECT * FROM v_pedido_mesa WHERE id_pedido = ?");
            $stm->execute(array($pedido));
            $c = $stm->fetch(PDO::FETCH_OBJ);
            /* Traemos el detalle */
            $c->{'Detalle'} = $this->conexionn->query("SELECT * FROM tm_detalle_pedido WHERE codigo = '$data' AND estado = 'a' ")
                ->fetchAll(PDO::FETCH_OBJ);
            foreach($c->Detalle as $k => $d)
            {
                $sqll = "UPDATE tm_detalle_pedido SET codigo = '' WHERE codigo = '$data'";
                $this->conexionn->prepare($sqll)->execute(array());

                $c->Detalle[$k]->{'Producto'} = $this->conexionn->query("SELECT nombre_prod, pres_prod FROM v_productos WHERE id_pres = " . $d->id_pres)
                    ->fetch(PDO::FETCH_OBJ);
            }
            return $c;



            
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }
    
    public function ObtenerDatosImpPCDelivery($data)
    {
        try
        {
            $query = "select `p`.`id_pedido` AS `id_pedido`,`p`.`id_tipo_pedido` AS `id_tipo_p`,`p`.`id_usu` AS `id_usu`,`p`.`fecha_pedido` AS `fecha_p`,`p`.`estado` AS `estado`,`pd`.`nomb_cliente` AS `nomb_c`,`pd`.`direccion`,`pd`.`telefono`,`pd`.`comentario` AS `comentario`, `pd`.`motorizado` AS `motorizado` from `tm_pedido` `p` join `tm_pedido_delivery` `pd` on `p`.`id_pedido` = `pd`.`id_pedido` where `p`.`id_pedido` = ? and `p`.`estado` = 'a' order by `p`.`id_pedido` desc";
            $stm = $this->conexionn->prepare($query);
            $stm->execute(array($data));
            $c = $stm->fetch(PDO::FETCH_OBJ);
            /* Traemos el detalle */
            $c->{'Detalle'} = $this->conexionn->query("SELECT id_pres,SUM(cantidad) AS cantidad, precio FROM tm_detalle_pedido WHERE id_pedido = " . $c->id_pedido." AND estado <> 'i' GROUP BY id_pres")
            ->fetchAll(PDO::FETCH_OBJ);
            foreach($c->Detalle as $k => $d)
            {
                $c->Detalle[$k]->{'Producto'} = $this->conexionn->query("SELECT nombre_prod, pres_prod FROM v_productos WHERE id_pres = " . $d->id_pres)
                ->fetch(PDO::FETCH_OBJ);
            }
            return $c;
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }

    public function ListarDetallePed($data)
    {
        try
        {   
            if($data['tp'] == 1){ $tabla = 'v_pedido_mesa'; } elseif($data['tp'] == 2) { $tabla = 'v_pedido_llevar'; } elseif($data['tp'] == 3) { $tabla = 'v_pedido_delivery'; }
            $stm = $this->conexionn->prepare("SELECT id_pedido FROM ".$tabla." WHERE id_pedido = ?");
            $stm->execute(array($data['cod']));
            $c = $stm->fetch(PDO::FETCH_OBJ);
            /* Traemos el detalle */
            $c->{'Detalle'} = $this->conexionn->query("SELECT id_pres,SUM(cantidad) AS cantidad, precio, estado FROM tm_detalle_pedido WHERE id_pedido = " . $c->id_pedido." AND estado <> 'i' GROUP BY id_pres")
                ->fetchAll(PDO::FETCH_OBJ);
            foreach($c->Detalle as $k => $d)
            {
                $c->Detalle[$k]->{'Producto'} = $this->conexionn->query("SELECT nombre_prod, pres_prod FROM v_productos WHERE id_pres = " . $d->id_pres)
                    ->fetch(PDO::FETCH_OBJ);
            }
            return $c;
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }

    public function ListarDetalleSubPed($data)
    {
        try
        {   
            if($data['tp'] == 1){ $tabla = 'v_pedido_mesa'; } elseif($data['tp'] == 2) { $tabla = 'v_pedido_llevar'; } elseif($data['tp'] == 3) { $tabla = 'v_pedido_delivery'; }
            $stm = $this->conexionn->prepare("SELECT id_pedido FROM ".$tabla." WHERE id_pedido = ?");
            $stm->execute(array($data['cod']));
            $c = $stm->fetch(PDO::FETCH_OBJ);
            /* Traemos el detalle */
            $c->{'Detalle'} = $this->conexionn->query("SELECT id_pres, cantidad, precio, estado, fecha_pedido FROM tm_detalle_pedido WHERE id_pedido = ".$c->id_pedido." AND id_pres = ".$data['prod']." ORDER BY fecha_pedido DESC")
                ->fetchAll(PDO::FETCH_OBJ);
            foreach($c->Detalle as $k => $d)
            {
                $c->Detalle[$k]->{'Producto'} = $this->conexionn->query("SELECT nombre_prod, pres_prod FROM v_productos WHERE id_pres = " . $d->id_pres)
                    ->fetch(PDO::FETCH_OBJ);
            }
            return $c;
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }

    public function RMesa(Mesa $data)
    {
        try
        {
            date_default_timezone_set($_SESSION["zona_horaria"]);
            setlocale(LC_ALL,"es_ES@euro","es_ES","esp");
            $fecha = date("Y-m-d H:i:s");
            $id_usu = $_SESSION["id_usu"];
            if($_SESSION["rol_usr"] == 4){ $id_moso = $id_usu; } else { $id_moso = $data->__GET('cod_mozo'); };
            $consulta = "call usp_restRegMesa( :flag, :idMesa, :idTp, :idUsu, :idMoso, :fechaP, :nombC, :comen);";
            $arrayParam =  array(
                ':flag' => 1,
                ':idMesa' =>  $data->__GET('cod_mesa'),
                ':idTp' => 1,
                ':idUsu' =>  $id_usu,
                ':idMoso' =>  $id_moso,
                ':fechaP' => $fecha,
                ':nombC' => $data->__GET('nomb_cliente'),
                ':comen' => $data->__GET('comentario')
            );
            $st = $this->conexionn->prepare($consulta);
            $st->execute($arrayParam);
            $row = $st->fetch(PDO::FETCH_ASSOC);
            return $row;
        } catch (Exception $e) 
        {
            die($e->getMessage());
        }
    }

    public function RMostrador(Mostrador $data)
    {
        try
        {
            date_default_timezone_set($_SESSION["zona_horaria"]);
            setlocale(LC_ALL,"es_ES@euro","es_ES","esp");
            $fecha = date("Y-m-d H:i:s");
            $id_usu = $_SESSION["id_usu"];
            $consulta = "call usp_restRegMostrador( :flag, :idTp, :idUsu, :fechaP, :nombC, :comen);";
            $arrayParam =  array(
                ':flag' => 1,
                ':idTp' => 2,
                ':idUsu' =>  $id_usu,
                ':fechaP' => $fecha,
                ':nombC' => $data->__GET('nomb_cliente'),
                ':comen' => $data->__GET('comentario')
            );
            $st = $this->conexionn->prepare($consulta);
            $st->execute($arrayParam);
            $row = $st->fetch(PDO::FETCH_ASSOC);
            return $row;
        } catch (Exception $e) 
        {
            die($e->getMessage());
        }
    }

    public function RDelivery(Delivery $data)
    {
        try
        {
            date_default_timezone_set($_SESSION["zona_horaria"]);
            setlocale(LC_ALL,"es_ES@euro","es_ES","esp");
            $fecha = date("Y-m-d H:i:s");
            $id_usu = $_SESSION["id_usu"];
            $consulta = "call usp_restRegDelivery( :flag, :idTp, :idUsu, :fechaP, :nombC, :dirC, :motorC, :telfC, :comen);";
            $arrayParam =  array(
                ':flag' => 1,
                ':idTp' => 3,
                ':idUsu' =>  $id_usu,
                ':fechaP' => $fecha,
                ':nombC' => $data->__GET('nombCli'),
                ':dirC' => $data->__GET('direcCli'),
                ':motorC' => $data->__GET('motorizado'),
                ':telfC' => $data->__GET('telefCli'),
                ':comen' => $data->__GET('comentario')
            );
            $st = $this->conexionn->prepare($consulta);
            $st->execute($arrayParam);
            $row = $st->fetch(PDO::FETCH_ASSOC);
            return $row;
        } catch (Exception $e) 
        {
            die($e->getMessage());
        }
    }

    public function BuscarProducto($cod)
    {
        try
        {        
            $stm = $this->conexionn->prepare("SELECT * FROM v_productos WHERE (nombre_prod LIKE '%$cod%' OR cod_prod LIKE '%$cod%') AND estado <> 'i' ORDER BY nombre_prod LIMIT 5");
            $stm->execute();
            return $stm->fetchAll(PDO::FETCH_OBJ);
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }

    public function BuscarCliente($cod)
    {
        try
        {        
            $stm = $this->conexionn->prepare("SELECT * FROM v_clientes WHERE estado <> 'i' AND (dni LIKE '%$cod%' OR ruc LIKE '%$cod%') ORDER BY dni LIMIT 1");
            $stm->execute();
            return $stm->fetchAll(PDO::FETCH_OBJ);
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }

    //VALIDAR PEDIDOS (Mesa/Mostrador/Delivery)
    public function ValidarEstadoPedido($cod)
    {
        try {
            $consulta = "SELECT count(*) AS total FROM tm_pedido WHERE id_pedido = :id_pedido AND estado = 'a'";
            $result = $this->conexionn->prepare($consulta);
            $result->bindParam(':id_pedido',$cod,PDO::PARAM_INT);
            $result->execute();
            while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
                $valor = $row['total'];
            }
            return $valor;
        } catch (Exception $e) {
            return false;
        }
    }

    

    public function RegistrarPedido($data)
    {
        try 
        {
            date_default_timezone_set($_SESSION["zona_horaria"]);
            setlocale(LC_ALL,"es_ES@euro","es_ES","esp");
            $fecha = date("Y-m-d H:i:s"); 

            $key = '';

            $codigo= $key; 

            foreach($data['items'] as $d)
            {
                $sql = "INSERT INTO tm_detalle_pedido (id_pedido,id_pres,cantidad,cant,precio,comentario,fecha_pedido,fecha_envio,codigo) VALUES (?,?,?,?,?,?,?,?,?);";
                $this->conexionn->prepare($sql)->execute(array($data['cod_ped'],$d['producto_id'],$d['cantidad'],$d['cantidad'],$d['precio'],$d['comentario'],$fecha,$fecha,$codigo));
            }
        }
        catch (Exception $e) 
        {
            return false;
        }
    }

    public function CancelarPedido($data)
    {
        try 
        {
            $sql = "UPDATE tm_detalle_pedido SET estado = 'i' WHERE estado <> 'i' AND id_pedido = ? AND id_pres = ? AND fecha_pedido = ? LIMIT 1";
            $this->conexionn->prepare($sql)
                 ->execute(
                array(
                    $data->__GET('cod_ped'),
                    $data->__GET('cod_pres'),
                    $data->__GET('fec_ped')
                    )
                );
        } catch (Exception $e) 
        {
            die($e->getMessage());
        }
    }

    //REGISTRAR VENTA
    public function RegistrarVenta($data)
    {
        try
        {
            date_default_timezone_set($_SESSION["zona_horaria"]);
            setlocale(LC_ALL,"es_ES@euro","es_ES","esp");
            $fecha = date("Y-m-d H:i:s");
            $id_usu = $_SESSION["id_usu"];
            $id_apc = $_SESSION["id_apc"];
            $igv = $_SESSION["igv"];
            $total_bolsa = $data['c_bolsa'] * $_SESSION["imp_icbper"];
            $consulta = "call usp_restEmitirVenta( :flag, :idDP, :idTE, :idPed, :idCli, :idTp, :idTd, :idUsu, :idApc, :pagoTar, :dscto, :bolsa, :igv, :total, :fecha );";
            $arrayParam = array(
                ':flag' => 1,
                ':idDP' =>  $data['tipo_pedido'],
                ':idTE' =>  $data['tipoEmision'],
                ':idPed' =>  $data['cod_pedido'],
                ':idCli' =>  $data['cliente_id'],
                ':idTp' =>  $data['tipo_pago'],
                ':idTd' =>  $data['tipo_doc'],
                ':idUsu' =>  $id_usu,
                ':idApc' =>  $id_apc,
                ':pagoTar' => $data['pago_t'],
                ':dscto' => $data['m_desc'],
                ':bolsa' => $total_bolsa,
                ':igv' => $igv,
                ':total' =>  $data['total_pedido'],
                ':fecha' =>  $fecha
            );
            $st = $this->conexionn->prepare($consulta);
            $st->execute($arrayParam);

            while ($row = $st->fetch(PDO::FETCH_ASSOC)) {
                $cod = $row['cod'];
            }

            $this->conexionn = Database::Conectar();

            $a = $data['idProd'];
            $b = $data['cantProd'];
            $c = $data['precProd'];

            for($x=0; $x < sizeof($a); ++$x){
                if ($b[$x] > 0){
                    $sql = "INSERT INTO tm_detalle_venta (id_venta,id_prod,cantidad,precio) VALUES (?,?,?,?);";
                    $this->conexionn->prepare($sql)->execute(array($cod,$a[$x],$b[$x],$c[$x]));
                }
            }

            $this->conexionn = Database::Conectar();
            $cons = "call usp_restEmitirVentaDet( :flag, :idVen, :idPed, :fecha );";
            $arrayParam = array(
                ':flag' => 1,
                ':idVen' =>  $cod,
                ':idPed' =>  $data['cod_pedido'],
                ':fecha' =>  $fecha
            );
            $stm = $this->conexionn->prepare($cons);
            $stm->execute($arrayParam);
            return $cod;
        } catch (Exception $e) 
        {
            die($e->getMessage());
        }
    }

    //DESOCUPAR MESA
    public function Desocupar(Pedido $data)
    {
        try
        {
            if($data->__GET('cod_tipe') == 1){
                $consulta = "call usp_restDesocuparMesa( :flag, :idPed);";
                $arrayParam =  array(
                    ':flag' => 1,
                    ':idPed' =>  $data->__GET('cod_pede')
                );
                $st = $this->conexionn->prepare($consulta);
                $st->execute($arrayParam);
            } elseif($data->__GET('cod_tipe') == 2 OR $data->__GET('cod_tipe') == 3){
                $sql = "UPDATE tm_pedido SET estado = 'i' WHERE id_pedido = ?";
                $this->conexionn->prepare($sql)->execute(array($data->__GET('cod_pede')));
            }
        } catch (Exception $e) 
        {
            die($e->getMessage());
        }
    }

    public function ListarMozos()
    {
        try
        {   
            $stm = $this->conexionn->prepare("SELECT id_usu,nombres,ape_paterno,ape_materno FROM v_usuarios WHERE id_rol = 4");
            $stm->execute();            
            $c = $stm->fetchAll(PDO::FETCH_OBJ);
            $stm->closeCursor();
            return $c;
            $this->conexionn=null;
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }

    //NUEVO CLIENTE
    public function NuevoCliente($data)
    {
        try
        {
            $fecha_nac = date('Y-m-d',strtotime($data['fecha_nac']));
            $consulta = "call usp_restRegCliente( :flag, :dni, :ruc, :apeP, :apeM, :nomb, :razS, :telf, :fecN, :correo, :direc, @a);";
            $telefono = 0;
            if($data['telefono'] != '' and $data['telefono'] != null){
               $telefono = $data['telefono'];
            }
            $arrayParam =  array(
                ':flag' => 1,
                ':dni' => $data['dni'],
                ':ruc' => $data['ruc'],
                ':apeP' => $data['ape_paterno'],
                ':apeM' => $data['ape_materno'],
                ':nomb' => $data['nombres'],
                ':razS' => $data['razon_social'],
                ':telf' => $telefono,
                ':fecN' => $fecha_nac,
                ':correo' => $data['correo'],
                ':direc' => $data['direccion']
            );
            $st = $this->conexionn->prepare($consulta);
            $st->execute($arrayParam);
            /*
            while ($row = $st->fetch(PDO::FETCH_ASSOC)) {
                return $row['dup'];
            }*/

            $c = $st->fetch(PDO::FETCH_OBJ);
            return $c;

        } 
        catch (Exception $e) 
        {
            die($e->getMessage());
        }
    }

    public function ComboMesaOri($data)
    {
        try
        {   
            $stmm = $this->conexionn->prepare("SELECT * FROM tm_mesa WHERE id_catg = ? AND estado = 'i' ORDER BY nro_mesa ASC");
            $stmm->execute(array($data['cod']));
            $var = $stmm->fetchAll(PDO::FETCH_ASSOC);
            foreach($var as $v){
                echo '<option value="'.$v['id_mesa'].'">'.$v['nro_mesa'].'</option>';
            }
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }

    public function ComboMesaDes($data)
    {
        try
        {   
            $stmm = $this->conexionn->prepare("SELECT * FROM tm_mesa WHERE id_catg = ? AND estado = 'a' ORDER BY nro_mesa ASC");
            $stmm->execute(array($data['cod']));
            $var = $stmm->fetchAll(PDO::FETCH_ASSOC);
            foreach($var as $v){
                echo '<option value="'.$v['id_mesa'].'">'.$v['nro_mesa'].'</option>';
            }
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }

    public function CambiarMesa(Mesa $data)
    {
        try
        {
            $consulta = "call usp_restCambiarMesa( :flag, :codMO, :codMD);";
            $arrayParam =  array(
                ':flag' => 1,
                ':codMO' =>  $data->__GET('c_mesa'),
                ':codMD' => $data->__GET('co_mesa')
            );
            $st = $this->conexionn->prepare($consulta);
            $st->execute($arrayParam);
            $row = $st->fetch(PDO::FETCH_ASSOC);
            return $row;
        } catch (Exception $e) 
        {
            die($e->getMessage());
        }
    }

    public function preCuenta($data)
    {
        try 
        {
            if($data['est']=='i'){$est='p';}elseif($data['est']=='p'){$est='i';};
            $sql = "UPDATE tm_mesa SET estado = ? WHERE id_mesa = ?";
            $this->conexionn->prepare($sql)->execute(array($est,$data['cod']));
        }
        catch (Exception $e) 
        {
            return false;
        }
    }

    /* Detalle del Pedido llevar*/
    public function DetalleMostrador()
    {
        try
        {
            $cod = $_POST['cod'];
            $stm = $this->conexionn->prepare("SELECT id_pedido,id_pres,SUM(cantidad) AS cantidad,precio,estado FROM v_det_llevar WHERE id_pedido = ? GROUP BY id_pres");
            $stm->execute(array($cod));
            $c = $stm->fetchAll(PDO::FETCH_OBJ);
            foreach($c as $k => $d)
            {
                $c[$k]->{'Producto'} = $this->conexionn->query("SELECT nombre_prod,pres_prod FROM v_productos WHERE id_pres = ".$d->id_pres)
                ->fetch(PDO::FETCH_OBJ);
            }
            return $c;
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }

    /* Detalle del Pedido delivery*/
    public function DetalleDelivery()
    {
        try
        {
            $cod = $_POST['cod'];
            $stm = $this->conexionn->prepare("SELECT id_pedido,id_pres,SUM(cantidad) AS cantidad,precio,estado FROM v_det_delivery WHERE id_pedido = ? GROUP BY id_pres");
            $stm->execute(array($cod));
            $c = $stm->fetchAll(PDO::FETCH_OBJ);
            foreach($c as $k => $d)
            {
                $c[$k]->{'Producto'} = $this->conexionn->query("SELECT nombre_prod,pres_prod FROM v_productos WHERE id_pres = ".$d->id_pres)
                ->fetch(PDO::FETCH_OBJ);
            }
            return $c;
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }

    public function FinalizarPedido($data)
    {
        try 
        {
            $sql = "UPDATE tm_pedido SET estado = 'c' WHERE id_pedido = ?";
            $this->conexionn->prepare($sql)->execute(array($data->__GET('codPed')));
            $this->conexionn=null;
        } catch (Exception $e) 
        {
            die($e->getMessage());
        }
    }

    public function contadorPedidosPreparados()
    {
        try
        {      
            $stm = $this->conexionn->prepare("SELECT COUNT(id_pedido) AS cantidad FROM v_cocina_me WHERE id_tipo = 1 AND cantidad > 0 AND estado = 'c'");
            $stm->execute();            
            $c = $stm->fetchAll(PDO::FETCH_OBJ);
            $stm->closeCursor();
            return $c;
            $this->conexionn=null;
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }


   

    public function listarPedidosComandas()
    { 
        try
        {       
            $stm = $this->conexionn->prepare("SELECT * FROM tm_detalle_pedido WHERE codigo!='' group by codigo ");
            $stm->execute();            
            $c = $stm->fetchAll(PDO::FETCH_OBJ);
            $data = array("data" => $c);
            $json = json_encode($data);
            echo $json;
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }


   public function listarTirajes()
    {
        try
        {   
            $stm = $this->conexionn->prepare("SELECT * FROM tm_tiraje WHERE estado=1 order by idtiraje desc limit 1");
            $stm->execute();
            $c = $stm->fetchAll(PDO::FETCH_OBJ);
            $stm->closeCursor();
            return $c;
            $this->conexionn=null;
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }

    

    


    public function listarPedidosPreparados()
    {
        try
        {      
            if($_SESSION["rol_usr"] == 1 OR $_SESSION["rol_usr"] == 2){
                $stm = $this->conexionn->prepare("SELECT * FROM v_cocina_me WHERE id_tipo = 1 AND cantidad > 0 AND estado = 'c'");
                $stm->execute();   
            } elseif($_SESSION["rol_usr"] == 4){
                $stm = $this->conexionn->prepare("SELECT * FROM v_cocina_me WHERE id_tipo = 1 AND id_mozo = ? AND cantidad > 0 AND estado = 'c'");
                $stm->execute(array($_SESSION["id_usu"]));   
            } 
            $c = $stm->fetchAll(PDO::FETCH_OBJ);
            $data = array("data" => $c);
            $json = json_encode($data);
            echo $json;
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }

    public function pedidoEntregado($data)
    {
        try
        {   
            $sql = "UPDATE tm_detalle_pedido SET estado = 'x' WHERE id_pedido = ? AND id_pres = ? AND fecha_pedido = ?";
            $this->conexionn->prepare($sql)
              ->execute(array(
                $data['cod_ped'],
                $data['cod_pre'],
                $data['fecha']
                ));
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }
}