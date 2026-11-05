-- phpMyAdmin SQL Dump
-- version 5.0.2
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 22-09-2020 a las 19:27:11
-- Versión del servidor: 10.4.14-MariaDB
-- Versión de PHP: 7.2.33

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `db_rest`
--

DELIMITER $$
--
-- Procedimientos
--
CREATE  PROCEDURE `usp_cajaAperturar` (IN `_flag` INT(11), IN `_idTie` INT(11), IN `_idUsu` INT(11), IN `_idCaja` INT(11), IN `_idTurno` INT(11), IN `_fechaA` DATETIME, IN `_montoA` DECIMAL(10,2))  BEGIN
		DECLARE _duplicado INT DEFAULT 1;
		
		IF _flag = 1 THEN
			SELECT count(*) into _duplicado FROM tm_aper_cierre
			WHERE id_tie = _idTie AND id_usu = _idUsu AND id_caja = _idCaja AND id_turno = _idTurno AND estado = 'a';
			
			if _duplicado = 0 THEN
				INSERT INTO tm_aper_cierre (id_tie,id_usu,id_caja,id_turno,fecha_aper,monto_aper) 
				VALUES (_idTie, _idUsu, _idCaja, _idTurno, _fechaA, _montoA);
				
				SELECT @@IDENTITY INTO @id;
				
				SELECT @id AS cod, _duplicado AS dup;
			ELSE
				SELECT _duplicado AS dup;
			END IF;
		end if;
	END$$

CREATE  PROCEDURE `usp_cajaCerrar` (IN `_flag` INT(11), IN `_idApc` INT(11), IN `_fechaC` DATETIME, IN `_montoC` DECIMAL(10,2), IN `_montoS` DECIMAL(10,2))  BEGIN
		DECLARE _duplicado INT DEFAULT 0;
		DECLARE _per INT DEFAULT 0;
		
		IF _flag = 1 THEN
		
			SELECT COUNT(*) INTO _duplicado FROM tm_aper_cierre WHERE id_apc = _idApc AND estado = 'a';
			SELECT id_usu INTO _per FROM tm_aper_cierre WHERE id_apc = _idApc AND estado = 'a';
			
			IF _duplicado = 1 THEN
			
				UPDATE tm_aper_cierre SET fecha_cierre = _fechaC, monto_cierre = _montoC, monto_sistema = _montoS, estado = 'c' 
				WHERE id_apc = _idApc;
				
				SELECT _duplicado AS dup, _per AS per;
			ELSE
				SELECT _duplicado AS dup, _per AS per;
			END IF;
		END IF;
	END$$

CREATE  PROCEDURE `usp_comprasAnular` (IN `_flag` INT(11), IN `_idCom` INT(11))  BEGIN
	DECLARE _cont INT DEFAULT 0;
	if _flag = 1 then
	
		SELECT COUNT(*) INTO _cont FROM tm_compra WHERE estado = 'a' AND id_compra = _idCom;
		
		IF _cont = 1 THEN
			UPDATE tm_compra SET estado = 'i' WHERE id_compra = _idCom;
			DELETE FROM tm_inventario WHERE id_tipo_ope = 1 AND id_ope = _idCom;
			SELECT _cont AS cod;
		ELSE
			SELECT _cont AS cod;
		END IF;
	end if;
    END$$

CREATE  PROCEDURE `usp_comprasContado` (IN `_flag` INT(11), IN `_idProv` INT(11), IN `_idTc` INT(11), IN `_idTd` INT(11), IN `_idUsu` INT(11), IN `_fechaC` DATE, IN `_horaC` VARCHAR(45), IN `_serieD` VARCHAR(45), IN `_numD` VARCHAR(45), IN `_igv` DECIMAL(10,2), IN `_total` DECIMAL(10,2), IN `_desc` DECIMAL(10,2), IN `_obs` VARCHAR(100))  BEGIN
	IF _flag = 1 THEN
	
		INSERT INTO tm_compra (id_prov,id_tipo_compra,id_tipo_doc,id_usu,fecha_c,hora_c,serie_doc,num_doc,igv,total,descuento,observaciones)
		VALUES (_idProv, _idTc, _idTd, _idUsu, _fechaC, _horaC, _serieD, _numD, _igv, _total, _desc, _obs);
		
		SELECT @@IDENTITY INTO @id;
		
	END IF;
END$$

CREATE  PROCEDURE `usp_comprasCreditoCuotas` (IN `_flag` INT(11), IN `_idCre` INT(11), IN `_idUsu` INT(11), IN `_idApc` INT(11), IN `_imp` DECIMAL(10,2), IN `_fecha` DATETIME, IN `_egCaja` INT(11), IN `_montC` DECIMAL(10,2), IN `_amorC` DECIMAL(10,2), IN `_totalC` DECIMAL(10,2))  BEGIN
	DECLARE tcuota DECIMAL(10,2) DEFAULT 0;
	DECLARE motivo Varchar(100);
	
	IF _flag = 1 THEN
	
		INSERT INTO tm_credito_detalle (id_credito,id_usu,importe,fecha)
		VALUES (_idCre, _idUsu, _imp, _fecha);
	
			if (_egCaja = 1) then
	
				SELECT c.id_tipo_doc, c.serie_doc, c.num_doc, c.fecha_c, c.desc_prov INTO @idTd, @serDoc, @numDoc, @fechaC, @descP
				FROM v_compras AS c INNER JOIN tm_compra_credito AS cc ON c.id_compra = cc.id_compra
				WHERE cc.id_credito = _idCre;
		
			set motivo = @descP;
		
				INSERT INTO tm_gastos_adm (id_tipo_gasto,id_tipo_doc,id_usu,id_apc,serie_doc,num_doc,fecha_comp,importe,motivo,fecha_registro)
				VALUES (4, @idTd, _idUsu, _idApc, @serDoc, @numDoc, @fechaC, _montC, motivo, _fecha);
	
			end if;
	
		SET tcuota = _amorC + _imp;
	
		IF ( _totalC <= tcuota ) THEN
	
			UPDATE tm_compra_credito SET estado = 'a' WHERE id_credito = _idCre;
	
		END IF;
	
	end if;
	
END$$

CREATE  PROCEDURE `usp_comprasRegProveedor` (IN `_flag` INT(11), IN `_ruc` VARCHAR(13), IN `_razS` VARCHAR(100), IN `_direc` VARCHAR(100), IN `_telf` INT(9), IN `_email` VARCHAR(45), IN `_contc` VARCHAR(45), IN `_idProv` INT(11))  BEGIN
		DECLARE _duplicado INT DEFAULT 1;
		
		IF _flag = 1 THEN
		
			SELECT count(*) INTO _duplicado FROM tm_proveedor WHERE ruc = _ruc;
		
			IF _duplicado = 0 THEN
			
				INSERT INTO tm_proveedor (ruc,razon_social,direccion,telefono,email,contacto) 
				VALUES (_ruc, _razS, _direc, _telf, _email, _contc);
				
				SELECT @@IDENTITY INTO @id;
			
				SELECT _duplicado AS dup,@id AS cod;
			ELSE
				SELECT _duplicado AS dup;
			END IF;	
			
		END IF;
		
		if _flag = 2 then
		
			UPDATE tm_proveedor SET ruc = _ruc, razon_social = _razS, direccion = _direc, telefono = _telf, email = _email, contacto = _contc
			WHERE id_prov = _idProv;
			
		end if;
	END$$

CREATE  PROCEDURE `usp_configAlmacenes` (IN `_flag` INT(11), IN `_nombre` VARCHAR(45), IN `_estado` VARCHAR(5), IN `_idAlm` INT(11))  BEGIN
	DECLARE _cont INT DEFAULT 0;
	DECLARE _cod0 INT DEFAULT 0;
	DECLARE	_cod1 INT DEFAULT 1;
	DECLARE	_cod2 INT DEFAULT 2;
	
	IF _flag = 1 THEN
		SELECT COUNT(*) INTO _cont FROM tm_almacen WHERE nombre = _nombre;
	
		IF _cont = 0 THEN
			INSERT INTO tm_almacen (nombre,estado) VALUES (_nombre, _estado);
			SELECT _cod1 AS cod;
		ELSE
			SELECT _cod0 AS cod;
		END IF;
	END IF;
	
	IF _flag = 2 THEN
		SELECT COUNT(*) INTO _cont FROM tm_almacen WHERE nombre = _nombre AND estado = _estado;
	
		IF _cont = 0 THEN
			UPDATE tm_almacen SET nombre = _nombre, estado = _estado WHERE id_alm = _idAlm;
			SELECT _cod2 AS cod;
		ELSE
			SELECT _cod2 AS cod;
		END IF;
	END IF;
	END$$

CREATE  PROCEDURE `usp_configAreasProd` (IN `_flag` INT(11), IN `_idImp` INT(11), IN `_nombre` VARCHAR(45), IN `_estado` VARCHAR(5), IN `_idArea` INT(11))  BEGIN
	DECLARE _cont INT DEFAULT 0;
	DECLARE _cod0 INT DEFAULT 0;
	DECLARE	_cod1 INT DEFAULT 1;
	DECLARE	_cod2 INT DEFAULT 2;
	
	IF _flag = 1 THEN
		SELECT COUNT(*) INTO _cont FROM tm_area_prod WHERE nombre = _nombre;
	
		IF _cont = 0 THEN
			INSERT INTO tm_area_prod (id_imp,nombre,estado) VALUES (_idImp, _nombre, _estado);
			SELECT _cod1 AS cod;
		ELSE
			SELECT _cod0 AS cod;
		END IF;
	END IF;
	
	IF _flag = 2 THEN
		SELECT COUNT(*) INTO _cont FROM tm_area_prod WHERE id_imp = _idImp AND nombre = _nombre AND estado = _estado;
	
		IF _cont = 0 THEN
			UPDATE tm_area_prod SET id_imp = _idImp, nombre = _nombre, estado = _estado WHERE id_areap = _idArea;
			SELECT _cod2 AS cod;
		ELSE
			SELECT _cod2 AS cod;
		END IF;
	END IF;
	END$$

CREATE  PROCEDURE `usp_configCajas` (IN `_flag` INT(11), IN `_nombre` VARCHAR(45), IN `_estado` VARCHAR(5), IN `_idCaja` INT(11))  BEGIN
	DECLARE _cont INT DEFAULT 0;
	DECLARE _cod0 INT DEFAULT 0;
	DECLARE	_cod1 INT DEFAULT 1;
	DECLARE	_cod2 INT DEFAULT 2;
	
	IF _flag = 1 THEN
		SELECT COUNT(*) INTO _cont FROM tm_caja WHERE descripcion = _nombre;
	
		IF _cont = 0 THEN
			INSERT INTO tm_caja (descripcion,estado) VALUES (_nombre, _estado);
			SELECT _cod1 AS cod;
		ELSE
			SELECT _cod0 AS cod;
		END IF;
	END IF;
	
	IF _flag = 2 THEN
	
		SELECT COUNT(*) INTO _cont FROM tm_caja WHERE descripcion = _nombre AND estado = _estado;
	
		IF _cont = 0 THEN
			UPDATE tm_caja SET descripcion = _nombre, estado = _estado WHERE id_caja = _idCaja;
			SELECT _cod2 AS cod;
		ELSE
			SELECT _cod2 AS cod;
		END IF;
	END IF;
	END$$

CREATE  PROCEDURE `usp_configEliminarCategoriaIns` (IN `_id_catg` INT(11))  BEGIN
	DECLARE _cont INT DEFAULT 0;
	DECLARE _cont2 INT DEFAULT 1;
	SELECT COUNT(*) INTO _cont FROM tm_insumo WHERE id_catg = _id_catg;
	IF _cont = 0 THEN
		DELETE FROM tm_insumo_catg WHERE id_catg = _id_catg;
		SELECT _cont AS cod;
	ELSE
		SELECT _cont2 AS cod;
	END IF;
    END$$

CREATE  PROCEDURE `usp_configEliminarCategoriaProd` (IN `_id_catg` INT(11))  BEGIN
	DECLARE _cont INT DEFAULT 0;
	DECLARE _cont2 INT DEFAULT 1;
	SELECT COUNT(*) INTO _cont FROM tm_producto WHERE id_catg = _id_catg;
	IF _cont = 0 THEN
		DELETE FROM tm_producto_catg WHERE id_catg = _id_catg;
		SELECT _cont AS cod;
	ELSE
		SELECT _cont2 AS cod;
	END IF;
    END$$

CREATE  PROCEDURE `usp_configImpresoras` (IN `_flag` INT(11), IN `_nombre` VARCHAR(50), IN `_estado` VARCHAR(5), IN `_idImp` INT(11))  BEGIN
	DECLARE _cont INT DEFAULT 0;
	DECLARE _cod0 INT DEFAULT 0;
	DECLARE	_cod1 INT DEFAULT 1;
	DECLARE	_cod2 INT DEFAULT 2;
	
	IF _flag = 1 THEN
		SELECT COUNT(*) INTO _cont FROM tm_impresora WHERE nombre = _nombre;
	
		IF _cont = 0 THEN
			INSERT INTO tm_impresora (nombre,estado) VALUES (_nombre,_estado);
			SELECT _cod1 AS cod;
		ELSE
			SELECT _cod0 AS cod;
		END IF;
	END IF;
	
	IF _flag = 2 THEN
		SELECT COUNT(*) INTO _cont FROM tm_impresora WHERE nombre = _nombre AND estado = _estado;
	
		IF _cont = 0 THEN
			UPDATE tm_impresora SET nombre = _nombre, estado = _estado WHERE id_imp = _idImp;
			SELECT _cod2 AS cod;
		ELSE
			SELECT _cod2 AS cod;
		END IF;
	END IF;
    END$$

CREATE  PROCEDURE `usp_configInsumo` (IN `_flag` INT(11), IN `_idCatg` INT(11), IN `_idMed` INT(11), IN `_cod` VARCHAR(10), IN `_nombre` VARCHAR(45), IN `_stock` INT(11), IN `_costo` DECIMAL(10,2), IN `_estado` VARCHAR(5), IN `_idIns` INT(11))  BEGIN
	DECLARE _cont INT DEFAULT 0;
	DECLARE _cod0 INT DEFAULT 0;
	DECLARE	_cod1 INT DEFAULT 1;
	DECLARE	_cod2 INT DEFAULT 2;
	
	IF _flag = 1 THEN
	
		SELECT COUNT(*) INTO _cont FROM tm_insumo WHERE nomb_ins = _nombre;
	
		IF _cont = 0 THEN
			INSERT INTO tm_insumo (id_catg,id_med,cod_ins,nomb_ins,stock_min,cos_uni) VALUES ( _idCatg, _idMed, _cod, _nombre, _stock, _costo);
			SELECT _cod1 AS cod;
		ELSE
			SELECT _cod0 AS cod;
		END IF;
		
	END IF;
	
	IF _flag = 2 THEN
	
		SELECT COUNT(*) INTO _cont FROM tm_insumo WHERE id_catg = _idCatg AND id_med = _idMed AND cod_ins = _cod AND nomb_ins = _nombre AND stock_min = _stock AND cos_uni = _costo AND estado = _estado;
	
		IF _cont = 0 THEN
			UPDATE tm_insumo SET id_catg = _idCatg, id_med = _idMed, cod_ins = _cod, nomb_ins = _nombre, stock_min = _stock, cos_uni = _costo, estado = _estado WHERE id_ins = _idIns;
			SELECT _cod2 AS cod;
		ELSE
			SELECT _cod2 AS cod;
		END IF;
	END IF;
    END$$

CREATE  PROCEDURE `usp_configInsumoCatgs` (IN `_flag` INT(11), IN `_descC` VARCHAR(45), IN `_idCatg` INT(11))  BEGIN
	DECLARE _cont INT DEFAULT 0;
	DECLARE _cod0 INT DEFAULT 0;
	DECLARE	_cod1 INT DEFAULT 1;
	DECLARE	_cod2 INT DEFAULT 2;
	
	IF _flag = 1 THEN
	
		SELECT COUNT(*) INTO _cont FROM tm_insumo_catg WHERE descripcion = _descC;
		
		IF _cont = 0 THEN
			INSERT INTO tm_insumo_catg (descripcion) VALUES (_descC);
			SELECT _cod1 AS cod;
		ELSE
			SELECT _cod0 AS cod;
		END IF;
	
	END IF;
	
	IF _flag = 2 THEN
	
		SELECT COUNT(*) INTO _cont FROM tm_insumo_catg WHERE descripcion = _descC;
		
		IF _cont = 0 THEN
			UPDATE tm_insumo_catg SET descripcion = _descC WHERE id_catg = _idCatg;
			SELECT _cod2 AS cod;
		ELSE
			SELECT _cod2 AS cod;
		END IF;
	
	END IF;
    END$$

CREATE  PROCEDURE `usp_configMesas` (IN `_flag` INT(11), IN `_idCatg` INT(11), IN `_nroMesa` VARCHAR(5), IN `_idMesa` INT(11))  BEGIN
	DECLARE _cont INT DEFAULT 0;
	DECLARE _cod0 INT DEFAULT 0;
	DECLARE	_cod1 INT DEFAULT 1;
	DECLARE	_cod2 INT DEFAULT 2;
	
	IF _flag = 1 THEN
	
		SELECT COUNT(*) INTO _cont FROM tm_mesa WHERE id_catg = _idCatg AND nro_mesa = _nroMesa;
	
		IF _cont = 0 THEN
			INSERT INTO tm_mesa (id_catg,nro_mesa) VALUES (_idCatg, _nroMesa);
			SELECT _cod1 AS cod;
		ELSE
			SELECT _cod0 AS cod;
		END IF;
	
	end if;
	
	IF _flag = 2 THEN
	
		SELECT COUNT(*) INTO _cont FROM tm_mesa WHERE id_catg = _idCatg AND nro_mesa = _nroMesa;
	
		IF _cont = 0 THEN
			UPDATE tm_mesa SET nro_mesa = _nroMesa WHERE id_mesa = _idMesa;
			SELECT _cod2 AS cod;
		ELSE
			SELECT _cod2 AS cod;
		END IF;
	
	END IF;
	
	IF _flag = 3 THEN
	
		SELECT count(*) INTO _cont FROM tm_pedido_mesa WHERE id_mesa = _idMesa;
	
		IF _cont = 0 THEN
			DELETE FROM tm_mesa WHERE id_mesa = _idMesa;
			SELECT _cod1 AS cod;
		ELSE
			SELECT _cod0 AS cod;
		END IF;
	
	END IF;
	END$$

CREATE  PROCEDURE `usp_configProducto` (IN `_flag` INT(11), IN `_idTipo` INT(11), IN `_idCatg` INT(11), IN `_idArea` INT(11), IN `_nombP` VARCHAR(45), IN `_descP` VARCHAR(200), IN `_estado` VARCHAR(45), IN `_idProd` INT(11))  BEGIN
	DECLARE _cont INT DEFAULT 0;
	DECLARE _cod0 INT DEFAULT 0;
	DECLARE	_cod1 INT DEFAULT 1;
	DECLARE	_cod2 INT DEFAULT 2;
	
	IF _flag = 1 THEN
		SELECT COUNT(*) INTO _cont FROM tm_producto WHERE id_tipo = _idTipo AND id_catg = _idCatg AND id_areap = _idArea AND nombre = _nombP;
		IF _cont = 0 THEN
			INSERT INTO tm_producto (id_tipo,id_catg,id_areap,nombre,descripcion) 
			VALUES ( _idTipo, _idCatg, _idArea, _nombP, _descP);
			SELECT _cod1 AS cod;
		else
			SELECT _cod0 AS cod;
		end if;
	end if;
	
	if _flag = 2 then
		SELECT COUNT(*) INTO _cont FROM tm_producto WHERE id_tipo = _idTipo AND id_catg = _idCatg AND id_areap = _idArea AND nombre = _nombP AND descripcion = _descP and estado = _estado;
		IF _cont = 0 THEN
			UPDATE tm_producto SET id_tipo = _idTipo, id_catg = _idCatg, id_areap = _idArea, nombre = _nombP, descripcion = _descP, estado = _estado 
			WHERE id_prod = _idProd;
			SELECT _cod2 AS cod;
		ELSE
			SELECT _cod2 AS cod;
		END IF;
	end if;
	
	END$$

CREATE  PROCEDURE `usp_configProductoCatgs` (IN `_flag` INT(11), IN `_descC` VARCHAR(45), IN `_idCatg` INT(11))  BEGIN	
	DECLARE _cont INT DEFAULT 0;
	DECLARE _cod0 INT DEFAULT 0;
	DECLARE	_cod1 INT DEFAULT 1;
	DECLARE	_cod2 INT DEFAULT 2;
	
	IF _flag = 1 THEN	
		
		SELECT COUNT(*) INTO _cont FROM tm_producto_catg WHERE descripcion = _descC;
		IF _cont = 0 THEN
			INSERT INTO tm_producto_catg (descripcion) VALUES (_descC);
			SELECT _cod1 AS cod;
		ELSE
			SELECT _cod0 AS cod;
		END IF;
	end if;
		
	IF _flag = 2 THEN
		SELECT COUNT(*) INTO _cont FROM tm_producto_catg WHERE descripcion = _descC;
		IF _cont = 0 THEN
			UPDATE tm_producto_catg SET descripcion = _descC WHERE id_catg = _idCatg;
			SELECT _cod2 AS cod;
		ELSE
			SELECT _cod2 AS cod;
		END IF;
	END IF;
	
	END$$

CREATE  PROCEDURE `usp_configProductoIngrs` (IN `_flag` INT(11), IN `_idPres` INT(11), IN `_idTIns` INT(11), IN `_idIns` INT(11), IN `_idMed` INT(11), IN `_cant` FLOAT, IN `_idPi` INT(11))  BEGIN
	if _flag = 1 then
		INSERT INTO tm_producto_ingr (id_pres,id_tipo_ins,id_ins,id_med,cant) VALUES (_idPres, _idTIns, _idIns, _idMed, _cant);
	end if;
	if _flag = 2 then
		UPDATE tm_producto_ingr SET cant = _cant WHERE id_pi = _idPi;
	end if;
	if _flag = 3 then
		DELETE FROM tm_producto_ingr WHERE id_pi = _idPi;
	end if;
    END$$

CREATE  PROCEDURE `usp_configProductoPres` (IN `_flag` INT(11), IN `_idProd` INT(11), IN `_codP` VARCHAR(45), IN `_presP` VARCHAR(45), IN `_precio` DECIMAL(10,2), IN `_rec` INT(1), IN `_stock` INT(11), IN `_estado` VARCHAR(5), IN `_img` VARCHAR(200), IN `_idPres` INT(1))  BEGIN
		
	DECLARE _cont INT DEFAULT 0;
	DECLARE _cod0 INT DEFAULT 0;
	DECLARE	_cod1 INT DEFAULT 1;
	DECLARE	_cod2 INT DEFAULT 2;
		
	IF _flag = 1 THEN
	
		SELECT COUNT(*) INTO _cont FROM tm_producto_pres WHERE presentacion = _presP AND id_prod = _idProd;
		
		IF _cont = 0 THEN
			INSERT INTO tm_producto_pres (id_prod,cod_prod,presentacion,precio,receta,stock_min,imagen,estado) 
			VALUES (_idProd, _codP, _presP, _precio, _rec, _stock, _img, _estado);
			SELECT _cod1 AS cod;
		ELSE
			SELECT _cod0 AS cod;
		END IF;
		
	end if;
	
	IF _flag = 2 THEN
	
		SELECT COUNT(*) INTO _cont FROM tm_producto_pres WHERE cod_prod = _codP AND presentacion = _presP AND precio = _precio AND receta = _rec AND stock_min = _stock AND imagen = _img AND estado = _estado;
		IF _cont = 0 THEN
			UPDATE tm_producto_pres SET cod_prod = _codP, presentacion = _presP, precio = _precio, receta = _rec, stock_min = _stock, imagen = _img, estado = _estado 
			WHERE id_pres = _idPres;
			SELECT _cod2 AS cod;
		ELSE
			SELECT _cod2 AS cod;
		END IF;
		
	END IF;
	END$$

CREATE  PROCEDURE `usp_configRol` (IN `_flag` INT(11), IN `_desc` VARCHAR(45), IN `_idRol` INT(11))  BEGIN
		DECLARE _duplicado INT DEFAULT 1;
		
		IF _flag = 1 THEN
		
				SELECT count(*) INTO _duplicado FROM tm_rol WHERE descripcion = _desc;
			
			IF _duplicado = 0 THEN
								INSERT INTO tm_rol (descripcion) VALUES (_desc);
				
				SELECT _duplicado AS dup;
			ELSE
				SELECT _duplicado AS dup;
			END IF;
		
		end if;
		
		IF _flag = 2 THEN
		
				SELECT COUNT(*) INTO _duplicado FROM tm_rol WHERE descripcion = _desc;
			
			IF _duplicado = 0 THEN
								UPDATE tm_rol SET descripcion = _desc WHERE id_rol = _idRol;
				
				SELECT _duplicado AS dup;
			ELSE
				SELECT _duplicado AS dup;
			END IF;
		
		END IF;
	END$$

CREATE  PROCEDURE `usp_configSalones` (IN `_flag` INT(11), IN `_desc` VARCHAR(45), IN `_est` VARCHAR(5), IN `_idCatg` INT(11))  BEGIN
	DECLARE _cont INT DEFAULT 0;
	DECLARE _cod0 INT DEFAULT 0;
	DECLARE	_cod1 INT DEFAULT 1;
	DECLARE	_cod2 INT DEFAULT 2;
	
	IF _flag = 1 THEN
	
		SELECT COUNT(*) INTO _cont FROM tm_salon WHERE descripcion = _desc AND estado = _est;
	
		IF _cont = 0 THEN
			INSERT INTO tm_salon (descripcion,estado) VALUES (_desc,_est);
			SELECT _cod1 AS cod;
		ELSE
			SELECT _cod0 AS cod;
		END IF;
	
	end if;
	
	IF _flag = 2 THEN
	
		SELECT COUNT(*) INTO _cont FROM tm_salon WHERE descripcion = _desc AND estado = _est;
	
		IF _cont = 0 THEN
			UPDATE tm_salon SET descripcion = _desc, estado = _est WHERE id_catg = _idCatg;
			SELECT _cod2 AS cod;
		ELSE
			SELECT _cod2 AS cod;
		END IF;
	
	END IF;
	
	IF _flag = 3 THEN
	
		SELECT count(*) INTO _cont FROM tm_mesa WHERE id_catg = _idCatg;
	
		IF _cont = 0 THEN
			DELETE FROM tm_salon WHERE id_catg = _idCatg;
			SELECT _cod1 AS cod;
		ELSE
			SELECT _cod0 AS cod;
		END IF;
	
	END IF;
	END$$

CREATE  PROCEDURE `usp_configTiendas` (IN `_flag` INT(11), IN `_nomb` VARCHAR(100), IN `_direc` VARCHAR(200), IN `_telef` VARCHAR(20), IN `_est` VARCHAR(5), IN `_idTie` INT(11))  BEGIN
	DECLARE _cont INT DEFAULT 0;
	DECLARE _cod0 INT DEFAULT 0;
	DECLARE	_cod1 INT DEFAULT 1;
	DECLARE	_cod2 INT DEFAULT 2;
	
	IF _flag = 1 THEN
		SELECT COUNT(*) INTO _cont FROM tm_tienda WHERE nombre = _nomb;
	
		IF _cont = 0 THEN
			INSERT INTO tm_tienda (nombre,direccion,telefono,estado) VALUES (_nomb,_direc,_telef,_est);
			SELECT _cod1 AS cod;
		ELSE
			SELECT _cod0 AS cod;
		END IF;
	END IF;
	
	IF _flag = 2 THEN
	
		SELECT COUNT(*) INTO _cont FROM tm_tienda WHERE nombre = _nomb AND direccion = _direc AND telefono = _telef AND estado = _est;
	
		IF _cont = 0 THEN
			UPDATE tm_tienda SET nombre = _nomb, direccion = _direc, telefono = _telef, estado = _est WHERE id_tie = _idTie;
			SELECT _cod2 AS cod;
		ELSE
			SELECT _cod2 AS cod;
		END IF;
	END IF;
    END$$

CREATE  PROCEDURE `usp_configUsuario` (IN `_flag` INT(11), IN `_idTie` INT(11), IN `_idRol` INT(11), IN `_idArea` INT(11), IN `_dni` VARCHAR(10), IN `_apeP` VARCHAR(45), IN `_apeM` VARCHAR(45), IN `_nomb` VARCHAR(45), IN `_email` VARCHAR(100), IN `_usu` VARCHAR(45), IN `_cont` VARCHAR(45), IN `_img` VARCHAR(45), IN `_idUsu` INT(11))  BEGIN
		DECLARE _contt INT DEFAULT 1;
		
		IF _flag = 1 THEN
		
			SELECT count(*) INTO _contt FROM tm_usuario WHERE id_tie = _idTie AND id_rol = _idRol AND usuario = _usu;
		
			IF _contt = 0 THEN
			
				INSERT INTO tm_usuario (id_tie,id_rol,id_areap,dni,ape_paterno,ape_materno,nombres,email,usuario,contrasena,imagen) 
				VALUES (_idTie,_idRol, _idArea, _dni,_apeP, _apeM, _nomb, _email, _usu, _cont, _img);
				
				SELECT _contt AS cod;
			ELSE
				SELECT _contt AS cod;
			END IF;
		
		end if;
		
		IF _flag = 2 THEN
			UPDATE tm_usuario SET id_tie = _idTie, id_rol = _idRol, id_areap = _idArea, dni = _dni, ape_paterno = _apeP, ape_materno = _apeM, nombres = _nomb, email = _email, usuario = _usu, contrasena = _cont, imagen = _img
			WHERE id_usu = _idUsu;
		END IF;
	END$$

CREATE  PROCEDURE `usp_invESAnular` (IN `_flag` INT(11), IN `_idEs` INT(11), IN `_idTo` INT(11))  BEGIN
	DECLARE _cont INT DEFAULT 0;
	IF _flag = 1 THEN
	
		SELECT COUNT(*) INTO _cont FROM tm_inventario_entsal WHERE estado = 'a' AND id_es = _idEs;
		
		IF _cont = 1 THEN
			UPDATE tm_inventario_entsal SET estado = 'i' WHERE id_es = _idEs;
			UPDATE tm_inventario SET estado = 'i' WHERE id_tipo_ope = _idTo AND id_ope = _idEs;
			SELECT _cont AS cod;
		ELSE
			SELECT _cont AS cod;
		END IF;
	END IF;
    END$$

CREATE  PROCEDURE `usp_restCambiarMesa` (IN `_flag` INT(11), IN `_codMO` INT(11), IN `_codMD` INT(11))  BEGIN
	DECLARE _duplicado INT DEFAULT 0;
	if _flag = 1 then
				SELECT COUNT(*) INTO _duplicado FROM tm_mesa WHERE id_mesa = _codMO AND estado = 'i';
		
		if _duplicado = 1 then 
						SELECT id_pedido INTO @cod FROM v_listar_mesas WHERE id_mesa = _codMO;
			
						UPDATE tm_mesa SET estado = 'a' WHERE id_mesa = _codMO;
			
						UPDATE tm_mesa SET estado = 'i' WHERE id_mesa = _codMD;
			
						UPDATE tm_pedido_mesa SET id_mesa = _codMD WHERE id_pedido = @cod;
			
			SELECT _duplicado AS dup;
		ELSE
			SELECT _duplicado AS dup;
		end if;
	end if;
    END$$

CREATE  PROCEDURE `usp_restCancelarPedido` (IN `_flag` INT(11), IN `_codPed` INT(11), IN `_codPro` INT(11), IN `_fechaPed` DATETIME)  BEGIN
	DECLARE _duplicado INT DEFAULT 0;
	IF _flag = 1 THEN
		SELECT COUNT(*) INTO _duplicado FROM tm_detalle_pedido WHERE id_pedido = _codPed AND id_prod = _codPro AND fecha_pedido = _fechaPed AND estado = 'a';
		
		IF _duplicado = 1 THEN
			UPDATE tm_detalle_pedido SET estado = 'i' WHERE id_pedido = _codPed AND id_prod = _codPro AND fecha_pedido = fecha_pedido;
			SELECT _duplicado AS dup;
		ELSE
			SELECT _duplicado AS dup;
		END IF;	
	END IF;
    END$$

CREATE  PROCEDURE `usp_restDesocuparMesa` (`_flag` INT(11), `_idPed` INT(11))  BEGIN
		DECLARE result INT DEFAULT 1;
		IF _flag = 1 THEN
			SELECT id_mesa INTO @codmesa FROM tm_pedido_mesa WHERE id_pedido = _idPed;
			UPDATE tm_mesa SET estado = 'a' WHERE id_mesa = @codmesa;
			UPDATE tm_pedido SET estado = 'i' WHERE id_pedido = _idPed;
			SELECT result AS resultado;
		END IF;
	END$$

CREATE  PROCEDURE `usp_restEmitirVenta` (`_flag` INT(11), `_idDP` INT(11), `_idTE` INT(11), `_idPed` INT(11), `_idCli` INT(11), `_idTp` INT(11), `_idTd` INT(11), `_idUsu` INT(11), `_idApc` INT(11), `_pagoTar` DECIMAL(10,2), `_dscto` DECIMAL(10,2), `_bolsa` DECIMAL(10,2), `_igv` DECIMAL(10,2), `_total` DECIMAL(10,2), `_fecha` DATETIME)  BEGIN
	DECLARE pagoe DECIMAL(10,2) DEFAULT 0;
	DECLARE pagot DECIMAL(10,2) DEFAULT 0;
	
	IF _idTp = 1 THEN
		SET pagoe = ( _total - _dscto + _bolsa);
		SET pagot = 0;
	ELSEIF _idTp = 2 THEN
		SET pagoe = 0;
		SET pagot = ( _total - _dscto + _bolsa);
	ELSEIF _idTp = 3 THEN
		SET pagoe = ( _total - _dscto + _bolsa) - _pagoTar;
		SET pagot = _pagoTar;
	END IF;
	
	IF _flag = 1 THEN
	
		SELECT td.serie,CONCAT(LPAD(COUNT(id_venta)+(td.numero),7,'0')) AS numero INTO @serie, @numero
		FROM tm_venta AS v INNER JOIN tm_tipo_doc AS td ON v.id_tipo_doc = td.id_tipo_doc
		WHERE v.id_tipo_doc = _idTd;
		INSERT INTO tm_venta (id_pedido, id_tipo_pedido, id_cliente, id_tipo_doc, id_tipo_pago, id_usu, id_apc, serie_doc, nro_doc, pago_efe, pago_tar, descuento, bolsa, igv, total, fecha_venta)
		VALUES (_idPed, _idDP, _idCli, _idTd, _idTp,_idUsu, _idApc, @serie,@numero, pagoe, pagot, _dscto, _bolsa, _igv, _total, _fecha );
		
		SELECT @@IDENTITY INTO @id;
		
		IF _idTE = 1 THEN
		
			IF _idDP = 1 THEN	
				SELECT id_mesa INTO @idMesa FROM tm_pedido_mesa WHERE id_pedido = _idPed;
				UPDATE tm_mesa SET estado = 'a' WHERE id_mesa = @idMesa;
				UPDATE tm_pedido SET estado = 'c' WHERE id_pedido = _idPed;
			elseIF _idDP = 2 or _idDP = 3 then
				UPDATE tm_pedido SET estado = 'x' WHERE id_pedido = _idPed;
			END IF;
		END IF;
			
		SELECT @id AS cod;
			
	END IF;
	
	END$$

CREATE  PROCEDURE `usp_restEmitirVentaDet` (`_flag` INT(11), `_idVen` INT(11), `_idPed` INT(11), `_fecha` DATETIME)  BEGIN
    
	DECLARE _idp INT; 
	DECLARE _cant INT;
	DECLARE _prec FLOAT;
	DECLARE _rec INT;
	DECLARE _tp INT;
	DECLARE done INT DEFAULT 0;
	DECLARE primera CURSOR FOR SELECT dp.id_prod, SUM(dp.cantidad) AS cantidad, dp.precio, pp.receta, p.id_tipo FROM tm_detalle_venta AS dp INNER JOIN tm_producto_pres AS pp
	ON dp.id_prod = pp.id_pres LEFT JOIN tm_producto AS p ON pp.id_prod = p.id_prod WHERE dp.id_venta = _idVen GROUP BY dp.id_prod;
	DECLARE segunda CURSOR FOR SELECT p.id_tipo_ins,p.id_ins, p.cant, ti.cos_uni FROM tm_producto_ingr AS p INNER JOIN v_insprod AS ti ON p.id_ins = ti.id_ins AND p.id_tipo_ins = ti.id_tipo_ins WHERE p.id_pres = _idp;
	DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;
	
	OPEN primera;
	REPEAT
	
	FETCH primera INTO _idp, _cant, _prec, _rec, _tp;
	IF NOT done THEN
			
		UPDATE tm_detalle_pedido SET cantidad = (cantidad - _cant) WHERE id_pedido = _idPed AND id_pres = _idp AND estado <> 'i' LIMIT 1;
	
		IF _rec = 1 THEN
			
			IF _tp = 2 THEN
			
				INSERT INTO tm_inventario (id_tipo_ope,id_ope,id_tipo_ins,id_ins,cos_uni,cant,fecha_r) VALUES (2,_idVen,2,_idp,_prec,_cant,_fecha);
			
			ELSEIF _tp = 1 THEN
				
				OPEN segunda;
				block2: BEGIN
						DECLARE doneLangLat INT DEFAULT 0;
						DECLARE _tipoin INT;
						DECLARE _ii INT;
						DECLARE i FLOAT;
						DECLARE _canti FLOAT;
						DECLARE _preci FLOAT;
						DECLARE CONTINUE HANDLER FOR NOT FOUND SET doneLangLat = 1;
			
					REPEAT
			
					FETCH segunda INTO _tipoin,_ii,_canti, _preci;
						IF NOT doneLangLat THEN
							
						SET i = _canti * _cant;
						INSERT INTO tm_inventario (id_tipo_ope,id_ope,id_tipo_ins,id_ins,cos_uni,cant,fecha_r) VALUES (2,_idVen,_tipoin,_ii,_preci,i,_fecha);
					
						END IF;
					UNTIL doneLangLat END REPEAT;
		
				END block2;
				CLOSE segunda;
			END IF;
		END IF;	
	END IF;
	UNTIL done END REPEAT;
	CLOSE primera;
    END$$

CREATE  PROCEDURE `usp_restRegCliente` (IN `_flag` INT(11), IN `_dni` VARCHAR(10), IN `_ruc` VARCHAR(13), IN `_apeP` VARCHAR(45), IN `_apeM` VARCHAR(45), IN `_nomb` VARCHAR(100), IN `_razS` VARCHAR(100), IN `_telf` INT(11), IN `_fecN` DATE, IN `_correo` VARCHAR(100), IN `_direc` VARCHAR(100), IN `_idCliente` INT(11))  BEGIN
		DECLARE _duplicado INT DEFAULT 1;
		
		IF _flag = 1 THEN
		
			SELECT count(*) INTO _duplicado FROM tm_cliente WHERE dni = _dni AND ruc = _ruc;
		
			IF _duplicado = 0 THEN
			
				INSERT INTO tm_cliente (dni,ruc,ape_paterno,ape_materno,nombres,razon_social,telefono,fecha_nac,correo,direccion) 
				VALUES (_dni, _ruc, _apeP, _apeM, _nomb, _razS, _telf, _fecN, _correo, _direc);
				
				SELECT @@IDENTITY INTO @id;
				
				SELECT _duplicado AS dup,@id AS cod;
			ELSE
				SELECT _duplicado AS dup;
			END IF;
		END IF;
		
		IF _flag = 2 then
		
			UPDATE tm_cliente SET dni = _dni, ruc = _ruc, ape_paterno = _apeP, ape_materno = _apeM, nombres = _nomb, 
			razon_social = _razS, telefono = _telf, fecha_nac = _fecN, correo = _correo, direccion = _direc 
			WHERE id_cliente = _idCliente;
			
		end if;
	END$$

CREATE  PROCEDURE `usp_restRegDelivery` (IN `_flag` INT(11), IN `_idTp` INT(11), IN `_idUsu` INT(11), IN `_fechaP` DATETIME, IN `_nombC` VARCHAR(100), IN `_dirC` VARCHAR(100), IN `_motorC` VARCHAR(100), IN `_telfC` VARCHAR(20), IN `_comen` VARCHAR(100))  BEGIN
	IF _flag = 1 THEN
		INSERT INTO `tm_pedido` (id_tipo_pedido,id_usu,fecha_pedido) VALUES (_idTp, _idUsu, _fechaP);
		
		SELECT @@IDENTITY INTO @id;
		
		SELECT CONCAT(LPAD(COUNT(id_pedido)+1,5,'0')) AS codigo INTO @nro_pedido FROM tm_pedido_delivery;
		
		INSERT INTO `tm_pedido_delivery` (id_pedido,nro_pedido,nomb_cliente,direccion,telefono,comentario,motorizado)
		VALUES (@id, @nro_pedido, _nombC, _dirC, _telfC, _comen, _motorC);
		
		SELECT @id AS cod;
	END IF;
END$$

CREATE  PROCEDURE `usp_restRegMesa` (IN `_flag` INT(11), IN `_idMesa` INT(11), IN `_idTp` INT(11), IN `_idUsu` INT(11), IN `_idMoso` INT(11), IN `_fechaP` DATETIME, IN `_nombC` VARCHAR(45), IN `_comen` VARCHAR(100))  BEGIN
	DECLARE _duplicado INT DEFAULT 0;
	
		IF _flag = 1 THEN
		
			SELECT COUNT(*) INTO _duplicado FROM tm_mesa WHERE id_mesa = _idMesa AND estado = 'a';
			
			if _duplicado = 1 THEN
		
				UPDATE tm_mesa SET estado = 'i' WHERE id_mesa = _idMesa;
				
				INSERT INTO tm_pedido (id_tipo_pedido,id_usu,fecha_pedido)
				VALUES (_idTp, _idUsu, _fechaP);
				
				SELECT @@IDENTITY INTO @id;
				
				INSERT INTO tm_pedido_mesa (id_pedido,id_mesa,id_mozo,nomb_cliente,comentario)
				VALUES (@id, _idMesa, _idMoso, _nombC, _comen);
				
				SELECT _duplicado AS dup, @id AS cod;
			ELSE
				SELECT _duplicado AS dup;
			END IF;
		END IF;
	END$$

CREATE  PROCEDURE `usp_restRegMostrador` (IN `_flag` INT(11), IN `_idTp` INT(11), IN `_idUsu` INT(11), IN `_fechaP` DATETIME, IN `_nombC` VARCHAR(45), IN `_comen` VARCHAR(100))  BEGIN
	IF _flag = 1 THEN
		
		INSERT INTO tm_pedido (id_tipo_pedido,id_usu,fecha_pedido)
		VALUES (_idTp, _idUsu, _fechaP);
		
		SELECT @@IDENTITY INTO @id;
		
		SELECT CONCAT(LPAD(COUNT(id_pedido)+1,5,'0')) AS codigo INTO @nro_pedido FROM tm_pedido_llevar;
		
		INSERT INTO tm_pedido_llevar (id_pedido,nro_pedido,nomb_cliente,comentario)
		VALUES (@id, @nro_pedido, _nombC, _comen);
		
		SELECT @id AS cod;
	
	END IF;
	END$$

CREATE  PROCEDURE `usp_tableroControl` (IN `_flag` INT(11), IN `_codDia` INT(11), IN `_fecha` DATE, IN `_feSei` DATE, IN `_feCin` DATE, IN `_feCua` DATE, IN `_feTre` DATE, IN `_feDos` DATE, IN `_feUno` DATE)  BEGIN
	if _flag = 1 then
				SELECT dia,margen into @dia,@margen FROM tm_margen_venta WHERE cod_dia = _codDia;
				SELECT IFNULL(SUM(total-descuento),0) into @siete FROM tm_venta WHERE DATE(fecha_venta) = _fecha;
				SELECT IFNULL(SUM(total-descuento),0) into @seis FROM tm_venta WHERE DATE(fecha_venta) = _feSei;
				SELECT IFNULL(SUM(total-descuento),0) into @cinco FROM tm_venta WHERE DATE(fecha_venta) = _feCin;
				SELECT IFNULL(SUM(total-descuento),0) into @cuatro FROM tm_venta WHERE DATE(fecha_venta) = _feCua;
				SELECT IFNULL(SUM(total-descuento),0) into @tres FROM tm_venta WHERE DATE(fecha_venta) = _feTre;
				SELECT IFNULL(SUM(total-descuento),0) into @dos FROM tm_venta WHERE DATE(fecha_venta) = _feDos;
				SELECT IFNULL(SUM(total-descuento),0) into @uno FROM tm_venta WHERE DATE(fecha_venta) = _feUno;
		
		select @dia as dia,@margen as margen,@siete as siete,@seis as seis,@cinco as cinco,@cuatro as cuatro,@tres as tres,@dos as dos,@uno as uno;	
	end if;
    END$$

CREATE  PROCEDURE `vsp_clientes` ()  BEGIN
	SELECT
  `tm_cliente`.`id_cliente` AS `id_cliente`,
  `tm_cliente`.`dni`        AS `dni`,
  `tm_cliente`.`ruc`        AS `ruc`,
  `tm_cliente`.`fecha_nac`  AS `fecha_nac`,
  `tm_cliente`.`direccion`  AS `direccion`,
  `tm_cliente`.`estado`     AS `estado`,
  CONCAT(IFNULL(`tm_cliente`.`razon_social`,''),'',`tm_cliente`.`nombres`,' ',`tm_cliente`.`ape_paterno`,' ',`tm_cliente`.`ape_materno`) AS `nombre`
FROM `tm_cliente`
ORDER BY `tm_cliente`.`id_cliente` DESC;
    END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tm_almacen`
--

CREATE TABLE `tm_almacen` (
  `id_alm` int(11) NOT NULL,
  `nombre` varchar(45) CHARACTER SET latin1 DEFAULT NULL,
  `estado` varchar(5) CHARACTER SET latin1 DEFAULT 'a'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Volcado de datos para la tabla `tm_almacen`
--

INSERT INTO `tm_almacen` (`id_alm`, `nombre`, `estado`) VALUES
(1, 'ABARROTES E INSUMOS', 'a'),
(2, 'BEBIDAS, GASEOSAS Y CERVEZAS', 'a');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tm_aper_cierre`
--

CREATE TABLE `tm_aper_cierre` (
  `id_apc` int(11) NOT NULL,
  `id_tie` int(11) NOT NULL,
  `id_usu` int(11) NOT NULL,
  `id_caja` int(11) NOT NULL,
  `id_turno` int(11) NOT NULL,
  `fecha_aper` datetime DEFAULT NULL,
  `monto_aper` decimal(10,2) DEFAULT 0.00,
  `fecha_cierre` datetime DEFAULT NULL,
  `monto_cierre` decimal(10,2) DEFAULT 0.00,
  `monto_sistema` decimal(10,2) DEFAULT 0.00,
  `estado` varchar(5) DEFAULT 'a'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tm_area_prod`
--

CREATE TABLE `tm_area_prod` (
  `id_areap` int(11) NOT NULL,
  `id_imp` int(11) NOT NULL,
  `nombre` varchar(45) NOT NULL,
  `estado` varchar(5) NOT NULL DEFAULT 'a'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Volcado de datos para la tabla `tm_area_prod`
--

INSERT INTO `tm_area_prod` (`id_areap`, `id_imp`, `nombre`, `estado`) VALUES
(1, 2, 'COCINA', 'a'),
(2, 3, 'BAR', 'a');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tm_caja`
--

CREATE TABLE `tm_caja` (
  `id_caja` int(11) NOT NULL,
  `descripcion` varchar(45) NOT NULL,
  `estado` varchar(5) DEFAULT 'a'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Volcado de datos para la tabla `tm_caja`
--

INSERT INTO `tm_caja` (`id_caja`, `descripcion`, `estado`) VALUES
(1, 'CAJA 01', 'a'),
(2, 'CAJA 02', 'i');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tm_cliente`
--

CREATE TABLE `tm_cliente` (
  `id_cliente` int(11) NOT NULL,
  `dni` varchar(10) NOT NULL,
  `ruc` varchar(13) DEFAULT NULL,
  `ape_paterno` varchar(45) DEFAULT NULL,
  `ape_materno` varchar(45) DEFAULT NULL,
  `nombres` varchar(100) DEFAULT NULL,
  `razon_social` varchar(100) DEFAULT NULL,
  `telefono` int(11) DEFAULT NULL,
  `fecha_nac` date NOT NULL DEFAULT '0000-00-00',
  `correo` varchar(100) DEFAULT NULL,
  `direccion` varchar(100) DEFAULT 'S/DIRECCION',
  `estado` varchar(5) DEFAULT 'a'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Volcado de datos para la tabla `tm_cliente`
--

INSERT INTO `tm_cliente` (`id_cliente`, `dni`, `ruc`, `ape_paterno`, `ape_materno`, `nombres`, `razon_social`, `telefono`, `fecha_nac`, `correo`, `direccion`, `estado`) VALUES
(1, '********', '***********', 'EN', 'GENERAL', 'PUBLICO', '', NULL, '0000-00-00', NULL, 'SIN DIRECCI?N', 'a');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tm_compra`
--

CREATE TABLE `tm_compra` (
  `id_compra` int(11) NOT NULL,
  `id_prov` int(11) NOT NULL,
  `id_tipo_compra` int(11) NOT NULL,
  `id_tipo_doc` int(11) NOT NULL,
  `id_usu` int(11) DEFAULT NULL,
  `fecha_c` date DEFAULT NULL,
  `hora_c` varchar(45) DEFAULT NULL,
  `serie_doc` varchar(45) DEFAULT NULL,
  `num_doc` varchar(45) DEFAULT NULL,
  `igv` decimal(10,2) DEFAULT NULL,
  `total` decimal(10,2) DEFAULT NULL,
  `descuento` decimal(10,2) DEFAULT NULL,
  `estado` varchar(1) DEFAULT 'a',
  `observaciones` varchar(100) DEFAULT NULL,
  `fecha_reg` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tm_compra_credito`
--

CREATE TABLE `tm_compra_credito` (
  `id_credito` int(11) NOT NULL,
  `id_compra` int(11) NOT NULL,
  `total` decimal(10,2) DEFAULT NULL,
  `interes` decimal(10,2) DEFAULT NULL,
  `fecha` date DEFAULT NULL,
  `estado` varchar(5) DEFAULT 'p'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tm_compra_detalle`
--

CREATE TABLE `tm_compra_detalle` (
  `id_compra` int(11) NOT NULL,
  `id_tp` int(11) NOT NULL,
  `id_pres` int(11) NOT NULL,
  `cant` decimal(10,2) NOT NULL,
  `precio` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tm_credito_detalle`
--

CREATE TABLE `tm_credito_detalle` (
  `id_credito` int(11) DEFAULT NULL,
  `id_usu` int(11) DEFAULT NULL,
  `importe` decimal(10,2) DEFAULT NULL,
  `fecha` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tm_detalle_pedido`
--

CREATE TABLE `tm_detalle_pedido` (
  `id_pedido` int(11) NOT NULL,
  `id_pres` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `cant` int(11) NOT NULL,
  `precio` decimal(10,2) NOT NULL,
  `comentario` varchar(100) NOT NULL,
  `fecha_pedido` datetime NOT NULL,
  `fecha_envio` datetime NOT NULL,
  `estado` varchar(5) NOT NULL DEFAULT 'a'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tm_detalle_venta`
--

CREATE TABLE `tm_detalle_venta` (
  `id_venta` int(11) NOT NULL,
  `id_prod` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `precio` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tm_empresa`
--

CREATE TABLE `tm_empresa` (
  `id_de` int(11) NOT NULL,
  `trib_acr` varchar(20) DEFAULT NULL,
  `trib_car` int(5) DEFAULT NULL,
  `di_acr` varchar(20) DEFAULT NULL,
  `di_car` int(5) DEFAULT NULL,
  `imp_acr` varchar(20) DEFAULT NULL,
  `imp_val` decimal(10,2) DEFAULT NULL,
  `imp_icbper` decimal(10,2) DEFAULT NULL,
  `mon_acr` varchar(20) DEFAULT NULL,
  `mon_val` varchar(5) DEFAULT NULL,
  `ruc` varchar(20) DEFAULT NULL,
  `raz_soc` varchar(100) DEFAULT NULL,
  `direccion` varchar(100) DEFAULT NULL,
  `logo` varchar(45) DEFAULT NULL,
  `fac_ele` int(1) NOT NULL,
  `clave` varchar(100) NOT NULL,
  `usuariosol` varchar(100) NOT NULL,
  `clavesol` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Volcado de datos para la tabla `tm_empresa`
--

INSERT INTO `tm_empresa` (`id_de`, `trib_acr`, `trib_car`, `di_acr`, `di_car`, `imp_acr`, `imp_val`, `imp_icbper`, `mon_acr`, `mon_val`, `ruc`, `raz_soc`, `direccion`, `logo`, `fac_ele`, `clave`, `usuariosol`, `clavesol`) VALUES
(1, 'RUC', 11, 'DNI', 8, 'IGV', '18.00', '0.10', 'soles', 'S/', '20380381762', 'DON GUILLERMO', 'AV AVIACION 2727 SAN BORJA', '181215072944-ziapfye0.png', 3, '123654', 'MODDATOS', 'moddatos');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tm_gastos_adm`
--

CREATE TABLE `tm_gastos_adm` (
  `id_ga` int(11) NOT NULL,
  `id_tipo_gasto` int(11) NOT NULL,
  `id_tipo_doc` int(11) NOT NULL,
  `id_per` int(11) NOT NULL,
  `id_usu` int(11) NOT NULL,
  `id_apc` int(11) NOT NULL,
  `serie_doc` varchar(45) DEFAULT NULL,
  `num_doc` varchar(45) DEFAULT NULL,
  `fecha_comp` date DEFAULT NULL,
  `importe` decimal(10,2) DEFAULT NULL,
  `motivo` varchar(100) DEFAULT NULL,
  `fecha_registro` datetime DEFAULT NULL,
  `estado` varchar(5) DEFAULT 'a'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tm_impresora`
--

CREATE TABLE `tm_impresora` (
  `id_imp` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `estado` varchar(5) NOT NULL DEFAULT 'a'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Volcado de datos para la tabla `tm_impresora`
--

INSERT INTO `tm_impresora` (`id_imp`, `nombre`, `estado`) VALUES
(1, 'NINGUNO', 'a'),
(2, 'TICKET-COCINA', 'a'),
(3, 'TICKET-BAR', 'a');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tm_ingresos_adm`
--

CREATE TABLE `tm_ingresos_adm` (
  `id_ing` int(11) NOT NULL,
  `id_usu` int(11) NOT NULL,
  `id_apc` int(11) NOT NULL,
  `importe` decimal(10,2) DEFAULT NULL,
  `motivo` varchar(200) DEFAULT NULL,
  `fecha_reg` datetime DEFAULT NULL,
  `estado` varchar(5) DEFAULT 'a'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tm_insumo`
--

CREATE TABLE `tm_insumo` (
  `id_ins` int(11) NOT NULL,
  `id_catg` int(11) NOT NULL,
  `id_med` int(11) NOT NULL,
  `cod_ins` varchar(10) DEFAULT NULL,
  `nomb_ins` varchar(45) DEFAULT NULL,
  `stock_min` int(11) DEFAULT NULL,
  `cos_uni` decimal(10,2) DEFAULT NULL,
  `estado` varchar(5) DEFAULT 'a'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tm_insumo_catg`
--

CREATE TABLE `tm_insumo_catg` (
  `id_catg` int(11) NOT NULL,
  `descripcion` varchar(45) NOT NULL,
  `estado` varchar(5) DEFAULT 'a'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tm_inventario`
--

CREATE TABLE `tm_inventario` (
  `id_inv` int(11) NOT NULL,
  `id_tipo_ope` int(11) NOT NULL,
  `id_ope` int(11) NOT NULL,
  `id_tipo_ins` int(11) NOT NULL,
  `id_ins` int(11) NOT NULL,
  `cos_uni` decimal(10,2) NOT NULL,
  `cant` float NOT NULL,
  `fecha_r` datetime NOT NULL,
  `estado` varchar(5) NOT NULL DEFAULT 'a'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tm_inventario_entsal`
--

CREATE TABLE `tm_inventario_entsal` (
  `id_es` int(11) NOT NULL,
  `id_usu` int(11) NOT NULL,
  `id_tipo` int(11) NOT NULL,
  `motivo` varchar(200) NOT NULL,
  `fecha` datetime NOT NULL,
  `estado` varchar(5) NOT NULL DEFAULT 'a'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tm_margen_venta`
--

CREATE TABLE `tm_margen_venta` (
  `id` int(11) NOT NULL,
  `cod_dia` int(11) NOT NULL,
  `dia` varchar(45) NOT NULL,
  `margen` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Volcado de datos para la tabla `tm_margen_venta`
--

INSERT INTO `tm_margen_venta` (`id`, `cod_dia`, `dia`, `margen`) VALUES
(1, 1, 'Lunes', '150.00'),
(2, 2, 'Martes', '750.00'),
(3, 3, 'Mi?rcoles', '750.00'),
(4, 4, 'Jueves', '850.00'),
(5, 5, 'Viernes', '1200.00'),
(6, 6, 'S?bado', '1800.00'),
(7, 0, 'Domingo', '2500.00');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tm_mesa`
--

CREATE TABLE `tm_mesa` (
  `id_mesa` int(11) NOT NULL,
  `id_catg` int(11) NOT NULL,
  `nro_mesa` varchar(5) NOT NULL,
  `estado` varchar(45) NOT NULL DEFAULT 'a'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tm_pedido`
--

CREATE TABLE `tm_pedido` (
  `id_pedido` int(11) NOT NULL,
  `id_tipo_pedido` int(11) NOT NULL,
  `id_usu` int(11) NOT NULL,
  `fecha_pedido` datetime NOT NULL,
  `estado` varchar(5) NOT NULL DEFAULT 'a'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tm_pedido_delivery`
--

CREATE TABLE `tm_pedido_delivery` (
  `id_pedido` int(11) NOT NULL,
  `nro_pedido` varchar(10) NOT NULL,
  `nomb_cliente` varchar(100) NOT NULL,
  `direccion` varchar(100) NOT NULL,
  `telefono` varchar(20) NOT NULL,
  `comentario` varchar(100) NOT NULL,
  `motorizado` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tm_pedido_llevar`
--

CREATE TABLE `tm_pedido_llevar` (
  `id_pedido` int(11) NOT NULL,
  `nro_pedido` varchar(10) NOT NULL,
  `nomb_cliente` varchar(100) NOT NULL,
  `comentario` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tm_pedido_mesa`
--

CREATE TABLE `tm_pedido_mesa` (
  `id_pedido` int(11) NOT NULL,
  `id_mesa` int(11) NOT NULL,
  `id_mozo` int(11) NOT NULL,
  `nomb_cliente` varchar(45) NOT NULL,
  `nro_personas` int(11) NOT NULL,
  `comentario` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tm_producto`
--

CREATE TABLE `tm_producto` (
  `id_prod` int(11) NOT NULL,
  `id_tipo` int(11) NOT NULL,
  `id_catg` int(11) NOT NULL DEFAULT 0,
  `id_areap` int(11) NOT NULL,
  `nombre` varchar(45) DEFAULT NULL,
  `descripcion` varchar(200) DEFAULT NULL,
  `estado` varchar(45) DEFAULT 'a'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Volcado de datos para la tabla `tm_producto`
--

INSERT INTO `tm_producto` (`id_prod`, `id_tipo`, `id_catg`, `id_areap`, `nombre`, `descripcion`, `estado`) VALUES
(1, 1, 30, 1, 'BOLSA', '', 'a');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tm_producto_catg`
--

CREATE TABLE `tm_producto_catg` (
  `id_catg` int(11) NOT NULL,
  `descripcion` varchar(45) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Volcado de datos para la tabla `tm_producto_catg`
--

INSERT INTO `tm_producto_catg` (`id_catg`, `descripcion`) VALUES
(30, 'BOLSAS');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tm_producto_ingr`
--

CREATE TABLE `tm_producto_ingr` (
  `id_pi` int(11) NOT NULL,
  `id_pres` int(11) NOT NULL,
  `id_tipo_ins` int(11) NOT NULL,
  `id_ins` int(11) NOT NULL,
  `id_med` int(11) NOT NULL,
  `cant` float(10,6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tm_producto_pres`
--

CREATE TABLE `tm_producto_pres` (
  `id_pres` int(11) NOT NULL,
  `id_prod` int(11) DEFAULT NULL,
  `cod_prod` varchar(45) NOT NULL,
  `presentacion` varchar(45) NOT NULL,
  `precio` decimal(10,2) NOT NULL,
  `receta` int(1) NOT NULL,
  `stock_min` int(11) NOT NULL,
  `imagen` varchar(200) NOT NULL DEFAULT 'default.png',
  `estado` varchar(5) NOT NULL DEFAULT 'a'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Volcado de datos para la tabla `tm_producto_pres`
--

INSERT INTO `tm_producto_pres` (`id_pres`, `id_prod`, `cod_prod`, `presentacion`, `precio`, `receta`, `stock_min`, `imagen`, `estado`) VALUES
(1, 1, 'BOL01', 'BOLSAS', '0.10', 0, 0, '200922072642.jpg', 'a');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tm_proveedor`
--

CREATE TABLE `tm_proveedor` (
  `id_prov` int(11) NOT NULL,
  `ruc` varchar(13) NOT NULL,
  `razon_social` varchar(100) NOT NULL,
  `direccion` varchar(100) DEFAULT NULL,
  `telefono` int(9) DEFAULT NULL,
  `email` varchar(45) DEFAULT NULL,
  `contacto` varchar(45) DEFAULT NULL,
  `estado` varchar(1) DEFAULT 'a'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tm_rol`
--

CREATE TABLE `tm_rol` (
  `id_rol` int(11) NOT NULL,
  `descripcion` varchar(45) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Volcado de datos para la tabla `tm_rol`
--

INSERT INTO `tm_rol` (`id_rol`, `descripcion`) VALUES
(1, 'ADMINISTRADOR'),
(2, 'CAJERO'),
(3, 'PRODUCCI?N'),
(4, 'MOZO');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tm_salon`
--

CREATE TABLE `tm_salon` (
  `id_catg` int(11) NOT NULL,
  `descripcion` varchar(45) NOT NULL,
  `estado` varchar(5) NOT NULL DEFAULT 'a'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tm_tienda`
--

CREATE TABLE `tm_tienda` (
  `id_tie` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `direccion` varchar(200) NOT NULL,
  `telefono` varchar(20) NOT NULL,
  `estado` varchar(5) NOT NULL DEFAULT 'a'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Volcado de datos para la tabla `tm_tienda`
--

INSERT INTO `tm_tienda` (`id_tie`, `nombre`, `direccion`, `telefono`, `estado`) VALUES
(1, 'Principal', 'AV AVIACION 2727 SAN BORJA', '2258346', 'a');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tm_tipo_compra`
--

CREATE TABLE `tm_tipo_compra` (
  `id_tipo_compra` int(11) NOT NULL,
  `descripcion` varchar(45) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Volcado de datos para la tabla `tm_tipo_compra`
--

INSERT INTO `tm_tipo_compra` (`id_tipo_compra`, `descripcion`) VALUES
(1, 'CONTADO'),
(2, 'CREDITO');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tm_tipo_doc`
--

CREATE TABLE `tm_tipo_doc` (
  `id_tipo_doc` int(11) NOT NULL,
  `descripcion` varchar(45) NOT NULL,
  `serie` varchar(3) NOT NULL,
  `numero` varchar(8) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Volcado de datos para la tabla `tm_tipo_doc`
--

INSERT INTO `tm_tipo_doc` (`id_tipo_doc`, `descripcion`, `serie`, `numero`) VALUES
(1, 'BOLETA', '001', '0000001'),
(2, 'FACTURA', '001', '0000001'),
(3, 'TICKET', '001', '0000001'),
(4, 'OTROS', '002', '0000001');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tm_tipo_gasto`
--

CREATE TABLE `tm_tipo_gasto` (
  `id_tipo_gasto` int(11) NOT NULL,
  `descripcion` varchar(45) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Volcado de datos para la tabla `tm_tipo_gasto`
--

INSERT INTO `tm_tipo_gasto` (`id_tipo_gasto`, `descripcion`) VALUES
(1, 'POR COMPRAS'),
(2, 'POR SREVICIOS'),
(3, 'POR REMUNERACI?N'),
(4, 'POR CREDITO DE COMPRAS');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tm_tipo_medida`
--

CREATE TABLE `tm_tipo_medida` (
  `id_med` int(11) NOT NULL,
  `descripcion` varchar(45) NOT NULL,
  `grupo` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Volcado de datos para la tabla `tm_tipo_medida`
--

INSERT INTO `tm_tipo_medida` (`id_med`, `descripcion`, `grupo`) VALUES
(1, 'UNIDAD', 1),
(2, 'KILOS', 2),
(3, 'GRAMOS', 2),
(4, 'MILIGRAMOS', 2),
(5, 'LITRO', 3),
(6, 'MILILITRO', 3),
(7, 'LIBRAS', 2),
(8, 'ONZAS', 4);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tm_tipo_pago`
--

CREATE TABLE `tm_tipo_pago` (
  `id_tipo_pago` int(11) NOT NULL,
  `descripcion` varchar(45) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Volcado de datos para la tabla `tm_tipo_pago`
--

INSERT INTO `tm_tipo_pago` (`id_tipo_pago`, `descripcion`) VALUES
(1, 'EFECTIVO'),
(2, 'TARJETA'),
(3, 'AMBOS');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tm_tipo_pedido`
--

CREATE TABLE `tm_tipo_pedido` (
  `id_tipo_pedido` int(11) NOT NULL,
  `descripcion` varchar(45) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Volcado de datos para la tabla `tm_tipo_pedido`
--

INSERT INTO `tm_tipo_pedido` (`id_tipo_pedido`, `descripcion`) VALUES
(1, 'MESA'),
(2, 'LLEVAR'),
(3, 'DELIVERY');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tm_tipo_venta`
--

CREATE TABLE `tm_tipo_venta` (
  `id_tipo_venta` int(11) NOT NULL,
  `descripcion` varchar(45) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Volcado de datos para la tabla `tm_tipo_venta`
--

INSERT INTO `tm_tipo_venta` (`id_tipo_venta`, `descripcion`) VALUES
(1, 'CONTADO'),
(2, 'CREDITO');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tm_turno`
--

CREATE TABLE `tm_turno` (
  `id_turno` int(11) NOT NULL,
  `descripcion` varchar(45) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Volcado de datos para la tabla `tm_turno`
--

INSERT INTO `tm_turno` (`id_turno`, `descripcion`) VALUES
(1, 'MEDIO TURNO'),
(2, 'TURNO COMPLETO');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tm_usuario`
--

CREATE TABLE `tm_usuario` (
  `id_usu` int(11) NOT NULL,
  `id_tie` int(11) NOT NULL,
  `id_rol` int(11) NOT NULL,
  `id_areap` int(11) NOT NULL,
  `dni` varchar(10) NOT NULL,
  `ape_paterno` varchar(45) DEFAULT NULL,
  `ape_materno` varchar(45) DEFAULT NULL,
  `nombres` varchar(45) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `usuario` varchar(45) DEFAULT NULL,
  `contrasena` varchar(45) DEFAULT 'restpe',
  `estado` varchar(5) DEFAULT 'a',
  `imagen` varchar(45) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Volcado de datos para la tabla `tm_usuario`
--

INSERT INTO `tm_usuario` (`id_usu`, `id_tie`, `id_rol`, `id_areap`, `dni`, `ape_paterno`, `ape_materno`, `nombres`, `email`, `usuario`, `contrasena`, `estado`, `imagen`) VALUES
(1, 1, 1, 0, '44444444', 'Valle', 'Valle', 'Guillermo', 'guillermovaller@gmail.com', 'admin', '123456', 'a', '161117020710-avatar5.png');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tm_venta`
--

CREATE TABLE `tm_venta` (
  `id_venta` int(11) NOT NULL,
  `id_pedido` int(11) NOT NULL,
  `id_tipo_pedido` int(11) NOT NULL,
  `id_cliente` int(11) NOT NULL,
  `id_tipo_doc` int(11) NOT NULL,
  `id_tipo_pago` int(11) NOT NULL,
  `id_usu` int(11) NOT NULL,
  `id_apc` int(11) NOT NULL,
  `serie_doc` varchar(3) NOT NULL,
  `nro_doc` varchar(8) NOT NULL,
  `pago_efe` decimal(10,2) DEFAULT 0.00,
  `pago_tar` decimal(10,2) DEFAULT 0.00,
  `descuento` decimal(10,2) DEFAULT 0.00,
  `bolsa` decimal(10,2) DEFAULT 0.00,
  `igv` decimal(10,2) DEFAULT 0.00,
  `total` decimal(10,2) DEFAULT 0.00,
  `fecha_venta` datetime DEFAULT NULL,
  `estado` varchar(5) DEFAULT 'a',
  `observacion` varchar(100) DEFAULT NULL,
  `aceptado` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `v_caja_aper`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `v_caja_aper` (
`id_apc` int(11)
,`id_usu` int(11)
,`id_caja` int(11)
,`id_turno` int(11)
,`fecha_a` datetime
,`monto_a` decimal(10,2)
,`fecha_c` datetime
,`monto_c` decimal(10,2)
,`monto_s` decimal(10,2)
,`estado` varchar(5)
,`desc_per` varchar(137)
,`desc_caja` varchar(45)
,`desc_turno` varchar(45)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `v_clientes`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `v_clientes` (
`id_cliente` int(11)
,`dni` varchar(10)
,`ruc` varchar(13)
,`fecha_nac` date
,`direccion` varchar(100)
,`estado` varchar(5)
,`nombre` varchar(292)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `v_cocina_de`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `v_cocina_de` (
`id_pedido` int(11)
,`id_areap` int(11)
,`id_tipo` int(11)
,`id_pres` int(11)
,`cantidad` int(11)
,`comentario` varchar(100)
,`fecha_pedido` datetime
,`fecha_envio` datetime
,`estado` varchar(5)
,`nro_pedido` varchar(10)
,`id_usu` int(11)
,`nombre_prod` varchar(45)
,`pres_prod` varchar(45)
,`ape_paterno` varchar(45)
,`ape_materno` varchar(45)
,`nombres` varchar(45)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `v_cocina_me`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `v_cocina_me` (
`id_pedido` int(11)
,`id_areap` int(11)
,`id_tipo` int(11)
,`id_pres` int(11)
,`cantidad` int(11)
,`comentario` varchar(100)
,`fecha_pedido` datetime
,`fecha_envio` datetime
,`estado` varchar(5)
,`id_mesa` int(11)
,`id_mozo` int(11)
,`nombre_prod` varchar(45)
,`pres_prod` varchar(45)
,`nro_mesa` varchar(5)
,`desc_m` varchar(45)
,`ape_paterno` varchar(45)
,`ape_materno` varchar(45)
,`nombres` varchar(45)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `v_cocina_mo`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `v_cocina_mo` (
`id_pedido` int(11)
,`id_areap` int(11)
,`id_tipo` int(11)
,`id_pres` int(11)
,`cantidad` int(11)
,`comentario` varchar(100)
,`fecha_pedido` datetime
,`fecha_envio` datetime
,`estado` varchar(5)
,`nro_pedido` varchar(10)
,`id_usu` int(11)
,`nombre_prod` varchar(45)
,`pres_prod` varchar(45)
,`ape_paterno` varchar(45)
,`ape_materno` varchar(45)
,`nombres` varchar(45)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `v_compras`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `v_compras` (
`id_compra` int(11)
,`id_prov` int(11)
,`id_tipo_compra` int(11)
,`id_tipo_doc` int(11)
,`fecha_c` date
,`hora_c` varchar(45)
,`serie_doc` varchar(45)
,`num_doc` varchar(45)
,`igv` decimal(10,2)
,`total` decimal(10,2)
,`estado` varchar(1)
,`desc_tc` varchar(45)
,`desc_td` varchar(45)
,`desc_prov` varchar(100)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `v_det_delivery`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `v_det_delivery` (
`id_pedido` int(11)
,`id_pres` int(11)
,`cantidad` int(11)
,`precio` decimal(10,2)
,`estado` varchar(5)
,`nombre_prod` varchar(45)
,`pres_prod` varchar(45)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `v_det_llevar`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `v_det_llevar` (
`id_pedido` int(11)
,`id_pres` int(11)
,`cantidad` int(11)
,`precio` decimal(10,2)
,`estado` varchar(5)
,`nombre_prod` varchar(45)
,`pres_prod` varchar(45)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `v_gastosadm`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `v_gastosadm` (
`id_ga` int(11)
,`id_tg` int(11)
,`id_td` int(11)
,`id_per` int(11)
,`id_usu` int(11)
,`id_apc` int(11)
,`serie_doc` varchar(45)
,`num_doc` varchar(45)
,`fecha_comp` date
,`importe` decimal(10,2)
,`motivo` varchar(100)
,`fecha_re` datetime
,`estado` varchar(5)
,`des_tg` varchar(45)
,`des_td` varchar(45)
,`desc_usu` varchar(137)
,`desc_per` varchar(137)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `v_insprod`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `v_insprod` (
`id_tipo_ins` int(1)
,`id_ins` int(11)
,`cod_ins` varchar(45)
,`nomb_ins` varchar(91)
,`nomb_med` varchar(45)
,`cos_uni` decimal(10,2)
,`id_med` varchar(11)
,`grupo_med` varchar(11)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `v_insumos`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `v_insumos` (
`id_ins` int(11)
,`id_catg` int(11)
,`id_med` int(11)
,`cod_ins` varchar(10)
,`nomb_ins` varchar(45)
,`stock_min` int(11)
,`cos_uni` decimal(10,2)
,`estado` varchar(5)
,`desc_c` varchar(45)
,`desc_m` varchar(45)
,`cod_g` int(11)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `v_inventario`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `v_inventario` (
`id_tipo_ins` int(11)
,`id_ins` int(11)
,`ent` double
,`sal` double
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `v_inventario_ent`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `v_inventario_ent` (
`id_tipo_ins` int(11)
,`id_ins` int(11)
,`total` double
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `v_inventario_sal`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `v_inventario_sal` (
`id_tipo_ins` int(11)
,`id_ins` int(11)
,`total` double
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `v_listar_mesas`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `v_listar_mesas` (
`id_mesa` int(11)
,`id_catg` int(11)
,`nro_mesa` varchar(5)
,`estado` varchar(45)
,`desc_m` varchar(45)
,`id_pedido` int(11)
,`fecha_p` datetime
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `v_mesas`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `v_mesas` (
`id_mesa` int(11)
,`id_catg` int(11)
,`nro_mesa` varchar(5)
,`estado` varchar(45)
,`desc_m` varchar(45)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `v_pedido_delivery`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `v_pedido_delivery` (
`id_pedido` int(11)
,`id_tipo_p` int(11)
,`id_usu` int(11)
,`fecha_p` datetime
,`estado` varchar(5)
,`nro_pedido` varchar(10)
,`nomb_c` varchar(100)
,`direc` varchar(100)
,`telef` varchar(20)
,`comentario` varchar(100)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `v_pedido_llevar`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `v_pedido_llevar` (
`id_pedido` int(11)
,`id_tipo_p` int(11)
,`id_usu` int(11)
,`fecha_p` datetime
,`estado` varchar(5)
,`nro_pedido` varchar(10)
,`nomb_c` varchar(100)
,`comentario` varchar(100)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `v_pedido_mesa`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `v_pedido_mesa` (
`id_pedido` int(11)
,`id_tipo_p` int(11)
,`id_usu` int(11)
,`id_mesa` int(11)
,`fecha_p` datetime
,`estado` varchar(5)
,`nomb_c` varchar(45)
,`nro_p` int(11)
,`comentario` varchar(100)
,`nro_mesa` varchar(5)
,`desc_m` varchar(45)
,`est_m` varchar(45)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `v_productos`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `v_productos` (
`id_pres` int(11)
,`id_prod` int(11)
,`id_tipo` int(11)
,`id_catg` int(11)
,`id_areap` int(11)
,`desc_c` varchar(45)
,`cod_prod` varchar(45)
,`nombre_prod` varchar(45)
,`pres_prod` varchar(45)
,`precio` decimal(10,2)
,`imagen` varchar(200)
,`estado` varchar(5)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `v_usuarios`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `v_usuarios` (
`id_usu` int(11)
,`id_tie` int(11)
,`id_rol` int(11)
,`id_areap` int(11)
,`dni` varchar(10)
,`ape_paterno` varchar(45)
,`ape_materno` varchar(45)
,`nombres` varchar(45)
,`email` varchar(100)
,`usuario` varchar(45)
,`contrasena` varchar(45)
,`estado` varchar(5)
,`imagen` varchar(45)
,`desc_r` varchar(45)
,`desc_t` varchar(100)
,`direc_t` varchar(200)
,`telf_t` varchar(20)
,`desc_ap` varchar(45)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `v_ventas_con`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `v_ventas_con` (
`id_ven` int(11)
,`id_ped` int(11)
,`id_tped` int(11)
,`id_cli` int(11)
,`id_tdoc` int(11)
,`id_tpag` int(11)
,`id_usu` int(11)
,`id_apc` int(11)
,`ser_doc` varchar(3)
,`nro_doc` varchar(8)
,`pago_efe` decimal(10,2)
,`pago_tar` decimal(10,2)
,`descu` decimal(10,2)
,`igv` decimal(10,2)
,`total` decimal(10,2)
,`fec_ven` datetime
,`estado` varchar(5)
,`obser` varchar(100)
,`desc_td` varchar(45)
,`desc_tp` varchar(45)
,`desc_usu` varchar(137)
);

-- --------------------------------------------------------

--
-- Estructura para la vista `v_caja_aper`
--
DROP TABLE IF EXISTS `v_caja_aper`;

CREATE ALGORITHM=UNDEFINED  SQL SECURITY DEFINER VIEW `v_caja_aper`  AS  select `apc`.`id_apc` AS `id_apc`,`apc`.`id_usu` AS `id_usu`,`apc`.`id_caja` AS `id_caja`,`apc`.`id_turno` AS `id_turno`,`apc`.`fecha_aper` AS `fecha_a`,`apc`.`monto_aper` AS `monto_a`,`apc`.`fecha_cierre` AS `fecha_c`,`apc`.`monto_cierre` AS `monto_c`,`apc`.`monto_sistema` AS `monto_s`,`apc`.`estado` AS `estado`,concat(`tp`.`nombres`,' ',`tp`.`ape_paterno`,' ',`tp`.`ape_materno`) AS `desc_per`,`tc`.`descripcion` AS `desc_caja`,`tt`.`descripcion` AS `desc_turno` from (((`tm_aper_cierre` `apc` join `tm_usuario` `tp` on(`apc`.`id_usu` = `tp`.`id_usu`)) join `tm_caja` `tc` on(`apc`.`id_caja` = `tc`.`id_caja`)) join `tm_turno` `tt` on(`apc`.`id_turno` = `tt`.`id_turno`)) order by `apc`.`id_apc` desc ;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_clientes`
--
DROP TABLE IF EXISTS `v_clientes`;

CREATE ALGORITHM=UNDEFINED  SQL SECURITY DEFINER VIEW `v_clientes`  AS  select `tm_cliente`.`id_cliente` AS `id_cliente`,`tm_cliente`.`dni` AS `dni`,`tm_cliente`.`ruc` AS `ruc`,`tm_cliente`.`fecha_nac` AS `fecha_nac`,`tm_cliente`.`direccion` AS `direccion`,`tm_cliente`.`estado` AS `estado`,concat(ifnull(`tm_cliente`.`razon_social`,''),'',`tm_cliente`.`nombres`,' ',`tm_cliente`.`ape_paterno`,' ',`tm_cliente`.`ape_materno`) AS `nombre` from `tm_cliente` order by `tm_cliente`.`id_cliente` desc ;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_cocina_de`
--
DROP TABLE IF EXISTS `v_cocina_de`;

CREATE ALGORITHM=UNDEFINED  SQL SECURITY DEFINER VIEW `v_cocina_de`  AS  (select `dp`.`id_pedido` AS `id_pedido`,`vp`.`id_areap` AS `id_areap`,`vp`.`id_tipo` AS `id_tipo`,`dp`.`id_pres` AS `id_pres`,if(`dp`.`cantidad` < `dp`.`cant`,`dp`.`cant`,`dp`.`cantidad`) AS `cantidad`,`dp`.`comentario` AS `comentario`,`dp`.`fecha_pedido` AS `fecha_pedido`,`dp`.`fecha_envio` AS `fecha_envio`,`dp`.`estado` AS `estado`,`pd`.`nro_pedido` AS `nro_pedido`,`tp`.`id_usu` AS `id_usu`,`vp`.`nombre_prod` AS `nombre_prod`,`vp`.`pres_prod` AS `pres_prod`,`vu`.`ape_paterno` AS `ape_paterno`,`vu`.`ape_materno` AS `ape_materno`,`vu`.`nombres` AS `nombres` from ((((`tm_detalle_pedido` `dp` join `tm_pedido_delivery` `pd` on(`dp`.`id_pedido` = `pd`.`id_pedido`)) join `tm_pedido` `tp` on(`dp`.`id_pedido` = `tp`.`id_pedido`)) join `v_productos` `vp` on(`dp`.`id_pres` = `vp`.`id_pres`)) join `v_usuarios` `vu` on(`tp`.`id_usu` = `vu`.`id_usu`)) where `dp`.`estado` <> 'c' and `dp`.`estado` <> 'i') ;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_cocina_me`
--
DROP TABLE IF EXISTS `v_cocina_me`;

CREATE ALGORITHM=UNDEFINED  SQL SECURITY DEFINER VIEW `v_cocina_me`  AS  select `dp`.`id_pedido` AS `id_pedido`,`vp`.`id_areap` AS `id_areap`,`vp`.`id_tipo` AS `id_tipo`,`dp`.`id_pres` AS `id_pres`,`dp`.`cantidad` AS `cantidad`,`dp`.`comentario` AS `comentario`,`dp`.`fecha_pedido` AS `fecha_pedido`,`dp`.`fecha_envio` AS `fecha_envio`,`dp`.`estado` AS `estado`,`pm`.`id_mesa` AS `id_mesa`,`pm`.`id_mozo` AS `id_mozo`,`vp`.`nombre_prod` AS `nombre_prod`,`vp`.`pres_prod` AS `pres_prod`,`vm`.`nro_mesa` AS `nro_mesa`,`vm`.`desc_m` AS `desc_m`,`vu`.`ape_paterno` AS `ape_paterno`,`vu`.`ape_materno` AS `ape_materno`,`vu`.`nombres` AS `nombres` from (((((`tm_detalle_pedido` `dp` join `tm_pedido_mesa` `pm` on(`dp`.`id_pedido` = `pm`.`id_pedido`)) join `tm_pedido` `tp` on(`dp`.`id_pedido` = `tp`.`id_pedido`)) join `v_productos` `vp` on(`dp`.`id_pres` = `vp`.`id_pres`)) join `v_mesas` `vm` on(`pm`.`id_mesa` = `vm`.`id_mesa`)) join `v_usuarios` `vu` on(`pm`.`id_mozo` = `vu`.`id_usu`)) where `dp`.`estado` <> 'i' ;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_cocina_mo`
--
DROP TABLE IF EXISTS `v_cocina_mo`;

CREATE ALGORITHM=UNDEFINED  SQL SECURITY DEFINER VIEW `v_cocina_mo`  AS  select `dp`.`id_pedido` AS `id_pedido`,`vp`.`id_areap` AS `id_areap`,`vp`.`id_tipo` AS `id_tipo`,`dp`.`id_pres` AS `id_pres`,if(`dp`.`cantidad` < `dp`.`cant`,`dp`.`cant`,`dp`.`cantidad`) AS `cantidad`,`dp`.`comentario` AS `comentario`,`dp`.`fecha_pedido` AS `fecha_pedido`,`dp`.`fecha_envio` AS `fecha_envio`,`dp`.`estado` AS `estado`,`pm`.`nro_pedido` AS `nro_pedido`,`tp`.`id_usu` AS `id_usu`,`vp`.`nombre_prod` AS `nombre_prod`,`vp`.`pres_prod` AS `pres_prod`,`vu`.`ape_paterno` AS `ape_paterno`,`vu`.`ape_materno` AS `ape_materno`,`vu`.`nombres` AS `nombres` from ((((`tm_detalle_pedido` `dp` join `tm_pedido_llevar` `pm` on(`dp`.`id_pedido` = `pm`.`id_pedido`)) join `tm_pedido` `tp` on(`dp`.`id_pedido` = `tp`.`id_pedido`)) join `v_productos` `vp` on(`dp`.`id_pres` = `vp`.`id_pres`)) join `v_usuarios` `vu` on(`tp`.`id_usu` = `vu`.`id_usu`)) where `dp`.`estado` <> 'c' and `dp`.`estado` <> 'i' ;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_compras`
--
DROP TABLE IF EXISTS `v_compras`;

CREATE ALGORITHM=UNDEFINED  SQL SECURITY DEFINER VIEW `v_compras`  AS  select `c`.`id_compra` AS `id_compra`,`c`.`id_prov` AS `id_prov`,`c`.`id_tipo_compra` AS `id_tipo_compra`,`c`.`id_tipo_doc` AS `id_tipo_doc`,`c`.`fecha_c` AS `fecha_c`,`c`.`hora_c` AS `hora_c`,`c`.`serie_doc` AS `serie_doc`,`c`.`num_doc` AS `num_doc`,`c`.`igv` AS `igv`,`c`.`total` AS `total`,`c`.`estado` AS `estado`,`tc`.`descripcion` AS `desc_tc`,`td`.`descripcion` AS `desc_td`,`tp`.`razon_social` AS `desc_prov` from (((`tm_compra` `c` join `tm_tipo_compra` `tc` on(`c`.`id_tipo_compra` = `tc`.`id_tipo_compra`)) join `tm_tipo_doc` `td` on(`c`.`id_tipo_doc` = `td`.`id_tipo_doc`)) join `tm_proveedor` `tp` on(`c`.`id_prov` = `tp`.`id_prov`)) where `c`.`id_compra` <> 0 order by `c`.`id_compra` desc ;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_det_delivery`
--
DROP TABLE IF EXISTS `v_det_delivery`;

CREATE ALGORITHM=UNDEFINED  SQL SECURITY DEFINER VIEW `v_det_delivery`  AS  (select `dp`.`id_pedido` AS `id_pedido`,`dp`.`id_pres` AS `id_pres`,if(`dp`.`cantidad` < `dp`.`cant`,`dp`.`cant`,`dp`.`cantidad`) AS `cantidad`,`dp`.`precio` AS `precio`,`dp`.`estado` AS `estado`,`vp`.`nombre_prod` AS `nombre_prod`,`vp`.`pres_prod` AS `pres_prod` from (((`tm_detalle_pedido` `dp` join `tm_pedido_delivery` `pd` on(`dp`.`id_pedido` = `pd`.`id_pedido`)) join `tm_pedido` `tp` on(`dp`.`id_pedido` = `tp`.`id_pedido`)) join `v_productos` `vp` on(`dp`.`id_pres` = `vp`.`id_pres`)) where `dp`.`estado` <> 'i') ;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_det_llevar`
--
DROP TABLE IF EXISTS `v_det_llevar`;

CREATE ALGORITHM=UNDEFINED  SQL SECURITY DEFINER VIEW `v_det_llevar`  AS  select `dp`.`id_pedido` AS `id_pedido`,`dp`.`id_pres` AS `id_pres`,if(`dp`.`cantidad` < `dp`.`cant`,`dp`.`cant`,`dp`.`cantidad`) AS `cantidad`,`dp`.`precio` AS `precio`,`dp`.`estado` AS `estado`,`vp`.`nombre_prod` AS `nombre_prod`,`vp`.`pres_prod` AS `pres_prod` from (((`tm_detalle_pedido` `dp` join `tm_pedido_llevar` `pm` on(`dp`.`id_pedido` = `pm`.`id_pedido`)) join `tm_pedido` `tp` on(`dp`.`id_pedido` = `tp`.`id_pedido`)) join `v_productos` `vp` on(`dp`.`id_pres` = `vp`.`id_pres`)) where `dp`.`estado` <> 'i' ;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_gastosadm`
--
DROP TABLE IF EXISTS `v_gastosadm`;

CREATE ALGORITHM=UNDEFINED  SQL SECURITY DEFINER VIEW `v_gastosadm`  AS  select `ga`.`id_ga` AS `id_ga`,`ga`.`id_tipo_gasto` AS `id_tg`,`ga`.`id_tipo_doc` AS `id_td`,`ga`.`id_per` AS `id_per`,`ga`.`id_usu` AS `id_usu`,`ga`.`id_apc` AS `id_apc`,`ga`.`serie_doc` AS `serie_doc`,`ga`.`num_doc` AS `num_doc`,`ga`.`fecha_comp` AS `fecha_comp`,`ga`.`importe` AS `importe`,`ga`.`motivo` AS `motivo`,`ga`.`fecha_registro` AS `fecha_re`,`ga`.`estado` AS `estado`,`tg`.`descripcion` AS `des_tg`,`td`.`descripcion` AS `des_td`,concat(`tu`.`nombres`,' ',`tu`.`ape_paterno`,' ',`tu`.`ape_materno`) AS `desc_usu`,concat(`tus`.`nombres`,' ',`tus`.`ape_paterno`,' ',`tus`.`ape_materno`) AS `desc_per` from ((((`tm_gastos_adm` `ga` join `tm_tipo_gasto` `tg` on(`ga`.`id_tipo_gasto` = `tg`.`id_tipo_gasto`)) join `tm_tipo_doc` `td` on(`ga`.`id_tipo_doc` = `td`.`id_tipo_doc`)) join `tm_usuario` `tu` on(`ga`.`id_usu` = `tu`.`id_usu`)) left join `tm_usuario` `tus` on(`ga`.`id_per` = `tus`.`id_usu`)) where `ga`.`id_ga` <> 0 order by `ga`.`id_ga` desc ;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_insprod`
--
DROP TABLE IF EXISTS `v_insprod`;

CREATE ALGORITHM=UNDEFINED  SQL SECURITY DEFINER VIEW `v_insprod`  AS  select 1 AS `id_tipo_ins`,`i`.`id_ins` AS `id_ins`,`i`.`cod_ins` AS `cod_ins`,`i`.`nomb_ins` AS `nomb_ins`,`m`.`descripcion` AS `nomb_med`,`i`.`cos_uni` AS `cos_uni`,`i`.`id_med` AS `id_med`,`m`.`grupo` AS `grupo_med` from (`tm_insumo` `i` join `tm_tipo_medida` `m` on(`i`.`id_med` = `m`.`id_med`)) union select 2 AS `tipo_p`,`pp`.`id_pres` AS `id_pres`,`pp`.`cod_prod` AS `cod_prod`,concat(`p`.`nombre`,' ',`pp`.`presentacion`) AS `CONCAT(p.nombre,' ',pp.presentacion)`,'UNIDAD' AS `UNIDAD`,`pp`.`precio` AS `cos_uni`,'1' AS `1`,'1' AS `1` from (`tm_producto` `p` join `tm_producto_pres` `pp` on(`p`.`id_prod` = `pp`.`id_prod`)) where `p`.`id_tipo` = 2 ;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_insumos`
--
DROP TABLE IF EXISTS `v_insumos`;

CREATE ALGORITHM=UNDEFINED  SQL SECURITY DEFINER VIEW `v_insumos`  AS  (select `i`.`id_ins` AS `id_ins`,`i`.`id_catg` AS `id_catg`,`i`.`id_med` AS `id_med`,`i`.`cod_ins` AS `cod_ins`,`i`.`nomb_ins` AS `nomb_ins`,`i`.`stock_min` AS `stock_min`,`i`.`cos_uni` AS `cos_uni`,`i`.`estado` AS `estado`,`ic`.`descripcion` AS `desc_c`,`m`.`descripcion` AS `desc_m`,`m`.`grupo` AS `cod_g` from ((`tm_insumo` `i` join `tm_insumo_catg` `ic` on(`i`.`id_catg` = `ic`.`id_catg`)) join `tm_tipo_medida` `m` on(`i`.`id_med` = `m`.`id_med`))) ;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_inventario`
--
DROP TABLE IF EXISTS `v_inventario`;

CREATE ALGORITHM=UNDEFINED  SQL SECURITY DEFINER VIEW `v_inventario`  AS  (select `e`.`id_tipo_ins` AS `id_tipo_ins`,`e`.`id_ins` AS `id_ins`,ifnull(`e`.`total`,0) AS `ent`,ifnull(`s`.`total`,0) AS `sal` from (`v_inventario_ent` `e` left join `v_inventario_sal` `s` on(`e`.`id_ins` = `s`.`id_ins`))) ;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_inventario_ent`
--
DROP TABLE IF EXISTS `v_inventario_ent`;

CREATE ALGORITHM=UNDEFINED  SQL SECURITY DEFINER VIEW `v_inventario_ent`  AS  (select `tm_inventario`.`id_tipo_ins` AS `id_tipo_ins`,`tm_inventario`.`id_ins` AS `id_ins`,if(`tm_inventario`.`id_tipo_ope` = 1 or `tm_inventario`.`id_tipo_ope` = 3,sum(`tm_inventario`.`cant`),0) AS `total` from `tm_inventario` where `tm_inventario`.`id_tipo_ope` <> 2 and `tm_inventario`.`id_tipo_ope` <> 4 group by `tm_inventario`.`id_tipo_ins`,`tm_inventario`.`id_ins`) ;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_inventario_sal`
--
DROP TABLE IF EXISTS `v_inventario_sal`;

CREATE ALGORITHM=UNDEFINED  SQL SECURITY DEFINER VIEW `v_inventario_sal`  AS  (select `tm_inventario`.`id_tipo_ins` AS `id_tipo_ins`,`tm_inventario`.`id_ins` AS `id_ins`,if(`tm_inventario`.`id_tipo_ope` = 2 or `tm_inventario`.`id_tipo_ope` = 4,sum(`tm_inventario`.`cant`),0) AS `total` from `tm_inventario` where `tm_inventario`.`id_tipo_ope` <> 1 and `tm_inventario`.`id_tipo_ope` <> 3 group by `tm_inventario`.`id_tipo_ins`,`tm_inventario`.`id_ins`) ;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_listar_mesas`
--
DROP TABLE IF EXISTS `v_listar_mesas`;

CREATE ALGORITHM=UNDEFINED  SQL SECURITY DEFINER VIEW `v_listar_mesas`  AS  select `vm`.`id_mesa` AS `id_mesa`,`vm`.`id_catg` AS `id_catg`,`vm`.`nro_mesa` AS `nro_mesa`,`vm`.`estado` AS `estado`,`vm`.`desc_m` AS `desc_m`,`vo`.`id_pedido` AS `id_pedido`,`vo`.`fecha_p` AS `fecha_p` from (`v_mesas` `vm` left join `v_pedido_mesa` `vo` on(`vm`.`id_mesa` = `vo`.`id_mesa`)) order by `vm`.`nro_mesa` ;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_mesas`
--
DROP TABLE IF EXISTS `v_mesas`;

CREATE ALGORITHM=UNDEFINED  SQL SECURITY DEFINER VIEW `v_mesas`  AS  select `m`.`id_mesa` AS `id_mesa`,`m`.`id_catg` AS `id_catg`,`m`.`nro_mesa` AS `nro_mesa`,`m`.`estado` AS `estado`,`cm`.`descripcion` AS `desc_m` from (`tm_mesa` `m` join `tm_salon` `cm` on(`m`.`id_catg` = `cm`.`id_catg`)) where `m`.`id_mesa` <> 0 and `cm`.`estado` <> 'i' order by `m`.`id_mesa` ;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_pedido_delivery`
--
DROP TABLE IF EXISTS `v_pedido_delivery`;

CREATE ALGORITHM=UNDEFINED  SQL SECURITY DEFINER VIEW `v_pedido_delivery`  AS  (select `p`.`id_pedido` AS `id_pedido`,`p`.`id_tipo_pedido` AS `id_tipo_p`,`p`.`id_usu` AS `id_usu`,`p`.`fecha_pedido` AS `fecha_p`,`p`.`estado` AS `estado`,`pd`.`nro_pedido` AS `nro_pedido`,`pd`.`nomb_cliente` AS `nomb_c`,`pd`.`direccion` AS `direc`,`pd`.`telefono` AS `telef`,`pd`.`comentario` AS `comentario` from (`tm_pedido` `p` join `tm_pedido_delivery` `pd` on(`p`.`id_pedido` = `pd`.`id_pedido`)) where `p`.`id_pedido` <> 0 order by `p`.`id_pedido` desc) ;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_pedido_llevar`
--
DROP TABLE IF EXISTS `v_pedido_llevar`;

CREATE ALGORITHM=UNDEFINED  SQL SECURITY DEFINER VIEW `v_pedido_llevar`  AS  select `p`.`id_pedido` AS `id_pedido`,`p`.`id_tipo_pedido` AS `id_tipo_p`,`p`.`id_usu` AS `id_usu`,`p`.`fecha_pedido` AS `fecha_p`,`p`.`estado` AS `estado`,`pl`.`nro_pedido` AS `nro_pedido`,`pl`.`nomb_cliente` AS `nomb_c`,`pl`.`comentario` AS `comentario` from (`tm_pedido` `p` join `tm_pedido_llevar` `pl` on(`p`.`id_pedido` = `pl`.`id_pedido`)) where `p`.`id_pedido` <> 0 order by `p`.`id_pedido` desc ;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_pedido_mesa`
--
DROP TABLE IF EXISTS `v_pedido_mesa`;

CREATE ALGORITHM=UNDEFINED  SQL SECURITY DEFINER VIEW `v_pedido_mesa`  AS  select `p`.`id_pedido` AS `id_pedido`,`p`.`id_tipo_pedido` AS `id_tipo_p`,`p`.`id_usu` AS `id_usu`,`pm`.`id_mesa` AS `id_mesa`,`p`.`fecha_pedido` AS `fecha_p`,`p`.`estado` AS `estado`,`pm`.`nomb_cliente` AS `nomb_c`,`pm`.`nro_personas` AS `nro_p`,`pm`.`comentario` AS `comentario`,`vm`.`nro_mesa` AS `nro_mesa`,`vm`.`desc_m` AS `desc_m`,`vm`.`estado` AS `est_m` from ((`tm_pedido` `p` join `tm_pedido_mesa` `pm` on(`p`.`id_pedido` = `pm`.`id_pedido`)) join `v_mesas` `vm` on(`pm`.`id_mesa` = `vm`.`id_mesa`)) where `p`.`id_pedido` <> 0 and `p`.`estado` = 'a' order by `p`.`id_pedido` desc ;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_productos`
--
DROP TABLE IF EXISTS `v_productos`;

CREATE ALGORITHM=UNDEFINED  SQL SECURITY DEFINER VIEW `v_productos`  AS  select `pp`.`id_pres` AS `id_pres`,`pp`.`id_prod` AS `id_prod`,`p`.`id_tipo` AS `id_tipo`,`p`.`id_catg` AS `id_catg`,`p`.`id_areap` AS `id_areap`,`cp`.`descripcion` AS `desc_c`,`pp`.`cod_prod` AS `cod_prod`,`p`.`nombre` AS `nombre_prod`,`pp`.`presentacion` AS `pres_prod`,`pp`.`precio` AS `precio`,`pp`.`imagen` AS `imagen`,`pp`.`estado` AS `estado` from ((`tm_producto_pres` `pp` join `tm_producto` `p` on(`pp`.`id_prod` = `p`.`id_prod`)) join `tm_producto_catg` `cp` on(`p`.`id_catg` = `cp`.`id_catg`)) where `pp`.`id_pres` <> 0 and `p`.`estado` = 'a' order by `pp`.`id_pres` desc ;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_usuarios`
--
DROP TABLE IF EXISTS `v_usuarios`;

CREATE ALGORITHM=UNDEFINED  SQL SECURITY DEFINER VIEW `v_usuarios`  AS  select `u`.`id_usu` AS `id_usu`,`u`.`id_tie` AS `id_tie`,`u`.`id_rol` AS `id_rol`,`u`.`id_areap` AS `id_areap`,`u`.`dni` AS `dni`,`u`.`ape_paterno` AS `ape_paterno`,`u`.`ape_materno` AS `ape_materno`,`u`.`nombres` AS `nombres`,`u`.`email` AS `email`,`u`.`usuario` AS `usuario`,`u`.`contrasena` AS `contrasena`,`u`.`estado` AS `estado`,`u`.`imagen` AS `imagen`,`r`.`descripcion` AS `desc_r`,`t`.`nombre` AS `desc_t`,`t`.`direccion` AS `direc_t`,`t`.`telefono` AS `telf_t`,`p`.`nombre` AS `desc_ap` from (((`tm_usuario` `u` join `tm_rol` `r` on(`u`.`id_rol` = `r`.`id_rol`)) left join `tm_tienda` `t` on(`u`.`id_tie` = `t`.`id_tie`)) left join `tm_area_prod` `p` on(`u`.`id_areap` = `p`.`id_areap`)) where `u`.`id_usu` <> 0 order by `u`.`id_usu` desc ;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_ventas_con`
--
DROP TABLE IF EXISTS `v_ventas_con`;

CREATE ALGORITHM=UNDEFINED  SQL SECURITY DEFINER VIEW `v_ventas_con`  AS  select `v`.`id_venta` AS `id_ven`,`v`.`id_pedido` AS `id_ped`,`v`.`id_tipo_pedido` AS `id_tped`,`v`.`id_cliente` AS `id_cli`,`v`.`id_tipo_doc` AS `id_tdoc`,`v`.`id_tipo_pago` AS `id_tpag`,`v`.`id_usu` AS `id_usu`,`v`.`id_apc` AS `id_apc`,`v`.`serie_doc` AS `ser_doc`,`v`.`nro_doc` AS `nro_doc`,`v`.`pago_efe` AS `pago_efe`,`v`.`pago_tar` AS `pago_tar`,`v`.`descuento` AS `descu`,`v`.`igv` AS `igv`,`v`.`total` AS `total`,`v`.`fecha_venta` AS `fec_ven`,`v`.`estado` AS `estado`,`v`.`observacion` AS `obser`,`td`.`descripcion` AS `desc_td`,`tp`.`descripcion` AS `desc_tp`,concat(`tu`.`ape_paterno`,' ',`tu`.`ape_materno`,' ',`tu`.`nombres`) AS `desc_usu` from (((`tm_venta` `v` join `tm_tipo_doc` `td` on(`v`.`id_tipo_doc` = `td`.`id_tipo_doc`)) join `tm_tipo_pago` `tp` on(`v`.`id_tipo_pago` = `tp`.`id_tipo_pago`)) join `tm_usuario` `tu` on(`v`.`id_usu` = `tu`.`id_usu`)) where `v`.`id_venta` <> 0 order by `v`.`id_venta` desc ;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `tm_almacen`
--
ALTER TABLE `tm_almacen`
  ADD PRIMARY KEY (`id_alm`);

--
-- Indices de la tabla `tm_aper_cierre`
--
ALTER TABLE `tm_aper_cierre`
  ADD PRIMARY KEY (`id_apc`),
  ADD KEY `FK_ac_caja` (`id_caja`),
  ADD KEY `FK_ac_turno` (`id_turno`),
  ADD KEY `FK_ac_usu` (`id_usu`);

--
-- Indices de la tabla `tm_area_prod`
--
ALTER TABLE `tm_area_prod`
  ADD PRIMARY KEY (`id_areap`),
  ADD KEY `FK_ap_alm` (`id_imp`);

--
-- Indices de la tabla `tm_caja`
--
ALTER TABLE `tm_caja`
  ADD PRIMARY KEY (`id_caja`);

--
-- Indices de la tabla `tm_cliente`
--
ALTER TABLE `tm_cliente`
  ADD PRIMARY KEY (`id_cliente`);

--
-- Indices de la tabla `tm_compra`
--
ALTER TABLE `tm_compra`
  ADD PRIMARY KEY (`id_compra`),
  ADD KEY `FK_comp_prov` (`id_prov`),
  ADD KEY `FK_comp_tipoc` (`id_tipo_compra`),
  ADD KEY `FK_comp_tipod` (`id_tipo_doc`),
  ADD KEY `FK_comp_usu` (`id_usu`);

--
-- Indices de la tabla `tm_compra_credito`
--
ALTER TABLE `tm_compra_credito`
  ADD PRIMARY KEY (`id_credito`),
  ADD KEY `FK_CC_ID_COMPRA_idx` (`id_compra`);

--
-- Indices de la tabla `tm_compra_detalle`
--
ALTER TABLE `tm_compra_detalle`
  ADD KEY `FK_CDET_COM` (`id_compra`);

--
-- Indices de la tabla `tm_credito_detalle`
--
ALTER TABLE `tm_credito_detalle`
  ADD KEY `FK_cred_usu` (`id_usu`),
  ADD KEY `FK_CRED_CRED` (`id_credito`);

--
-- Indices de la tabla `tm_detalle_pedido`
--
ALTER TABLE `tm_detalle_pedido`
  ADD KEY `FK_DPED_PRES` (`id_pres`),
  ADD KEY `FK_DPED_PED` (`id_pedido`);

--
-- Indices de la tabla `tm_detalle_venta`
--
ALTER TABLE `tm_detalle_venta`
  ADD KEY `FK_DVEN_VEN` (`id_venta`),
  ADD KEY `FK_DVEN_PRES` (`id_prod`);

--
-- Indices de la tabla `tm_empresa`
--
ALTER TABLE `tm_empresa`
  ADD PRIMARY KEY (`id_de`);

--
-- Indices de la tabla `tm_gastos_adm`
--
ALTER TABLE `tm_gastos_adm`
  ADD PRIMARY KEY (`id_ga`),
  ADD KEY `FK_gasto_tg` (`id_tipo_gasto`),
  ADD KEY `FK_gasto_td` (`id_tipo_doc`),
  ADD KEY `FK_EADM_APC` (`id_apc`),
  ADD KEY `FK_EADM_USU` (`id_usu`);

--
-- Indices de la tabla `tm_impresora`
--
ALTER TABLE `tm_impresora`
  ADD PRIMARY KEY (`id_imp`);

--
-- Indices de la tabla `tm_ingresos_adm`
--
ALTER TABLE `tm_ingresos_adm`
  ADD PRIMARY KEY (`id_ing`),
  ADD KEY `FK_IADM_USU` (`id_usu`),
  ADD KEY `FK_IADM_APC` (`id_apc`);

--
-- Indices de la tabla `tm_insumo`
--
ALTER TABLE `tm_insumo`
  ADD PRIMARY KEY (`id_ins`),
  ADD KEY `FK_ins_catg` (`id_catg`),
  ADD KEY `FK_ins_med` (`id_med`);

--
-- Indices de la tabla `tm_insumo_catg`
--
ALTER TABLE `tm_insumo_catg`
  ADD PRIMARY KEY (`id_catg`);

--
-- Indices de la tabla `tm_inventario`
--
ALTER TABLE `tm_inventario`
  ADD PRIMARY KEY (`id_inv`);

--
-- Indices de la tabla `tm_inventario_entsal`
--
ALTER TABLE `tm_inventario_entsal`
  ADD PRIMARY KEY (`id_es`),
  ADD KEY `FK_INVES_USU` (`id_usu`);

--
-- Indices de la tabla `tm_margen_venta`
--
ALTER TABLE `tm_margen_venta`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `tm_mesa`
--
ALTER TABLE `tm_mesa`
  ADD PRIMARY KEY (`id_mesa`),
  ADD KEY `FKM_IDCATG_idx` (`id_catg`);

--
-- Indices de la tabla `tm_pedido`
--
ALTER TABLE `tm_pedido`
  ADD PRIMARY KEY (`id_pedido`),
  ADD KEY `FK_ped_tp` (`id_tipo_pedido`),
  ADD KEY `FK_ped_usu` (`id_usu`);

--
-- Indices de la tabla `tm_pedido_delivery`
--
ALTER TABLE `tm_pedido_delivery`
  ADD KEY `FK_peddel_ped` (`id_pedido`);

--
-- Indices de la tabla `tm_pedido_llevar`
--
ALTER TABLE `tm_pedido_llevar`
  ADD KEY `FK_pedlle_ped` (`id_pedido`);

--
-- Indices de la tabla `tm_pedido_mesa`
--
ALTER TABLE `tm_pedido_mesa`
  ADD KEY `FK_pedme_ped` (`id_pedido`),
  ADD KEY `FK_pedme_mesa` (`id_mesa`),
  ADD KEY `FK_pedme_mozo` (`id_mozo`);

--
-- Indices de la tabla `tm_producto`
--
ALTER TABLE `tm_producto`
  ADD PRIMARY KEY (`id_prod`),
  ADD KEY `FK_prod_catg` (`id_catg`),
  ADD KEY `FK_prod_area` (`id_areap`);

--
-- Indices de la tabla `tm_producto_catg`
--
ALTER TABLE `tm_producto_catg`
  ADD PRIMARY KEY (`id_catg`);

--
-- Indices de la tabla `tm_producto_ingr`
--
ALTER TABLE `tm_producto_ingr`
  ADD PRIMARY KEY (`id_pi`),
  ADD KEY `FK_PING_PRES` (`id_pres`),
  ADD KEY `FK_PING_INS` (`id_ins`),
  ADD KEY `FK_PING_MED` (`id_med`);

--
-- Indices de la tabla `tm_producto_pres`
--
ALTER TABLE `tm_producto_pres`
  ADD PRIMARY KEY (`id_pres`),
  ADD KEY `FK_PROP_PROD` (`id_prod`);

--
-- Indices de la tabla `tm_proveedor`
--
ALTER TABLE `tm_proveedor`
  ADD PRIMARY KEY (`id_prov`);

--
-- Indices de la tabla `tm_rol`
--
ALTER TABLE `tm_rol`
  ADD PRIMARY KEY (`id_rol`);

--
-- Indices de la tabla `tm_salon`
--
ALTER TABLE `tm_salon`
  ADD PRIMARY KEY (`id_catg`);

--
-- Indices de la tabla `tm_tienda`
--
ALTER TABLE `tm_tienda`
  ADD PRIMARY KEY (`id_tie`);

--
-- Indices de la tabla `tm_tipo_compra`
--
ALTER TABLE `tm_tipo_compra`
  ADD PRIMARY KEY (`id_tipo_compra`);

--
-- Indices de la tabla `tm_tipo_doc`
--
ALTER TABLE `tm_tipo_doc`
  ADD PRIMARY KEY (`id_tipo_doc`);

--
-- Indices de la tabla `tm_tipo_gasto`
--
ALTER TABLE `tm_tipo_gasto`
  ADD PRIMARY KEY (`id_tipo_gasto`);

--
-- Indices de la tabla `tm_tipo_medida`
--
ALTER TABLE `tm_tipo_medida`
  ADD PRIMARY KEY (`id_med`);

--
-- Indices de la tabla `tm_tipo_pago`
--
ALTER TABLE `tm_tipo_pago`
  ADD PRIMARY KEY (`id_tipo_pago`);

--
-- Indices de la tabla `tm_tipo_pedido`
--
ALTER TABLE `tm_tipo_pedido`
  ADD PRIMARY KEY (`id_tipo_pedido`);

--
-- Indices de la tabla `tm_tipo_venta`
--
ALTER TABLE `tm_tipo_venta`
  ADD PRIMARY KEY (`id_tipo_venta`);

--
-- Indices de la tabla `tm_turno`
--
ALTER TABLE `tm_turno`
  ADD PRIMARY KEY (`id_turno`);

--
-- Indices de la tabla `tm_usuario`
--
ALTER TABLE `tm_usuario`
  ADD PRIMARY KEY (`id_usu`),
  ADD KEY `FKU_IDROL_idx` (`id_rol`);

--
-- Indices de la tabla `tm_venta`
--
ALTER TABLE `tm_venta`
  ADD PRIMARY KEY (`id_venta`),
  ADD KEY `FK_venta_ped` (`id_pedido`),
  ADD KEY `FK_venta_cli` (`id_cliente`),
  ADD KEY `FK_venta_td` (`id_tipo_doc`),
  ADD KEY `FK_venta_tp` (`id_tipo_pago`),
  ADD KEY `FK_venta_usu` (`id_usu`),
  ADD KEY `FK_venta_apc` (`id_apc`),
  ADD KEY `FK_venta_tpe` (`id_tipo_pedido`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `tm_almacen`
--
ALTER TABLE `tm_almacen`
  MODIFY `id_alm` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `tm_aper_cierre`
--
ALTER TABLE `tm_aper_cierre`
  MODIFY `id_apc` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tm_area_prod`
--
ALTER TABLE `tm_area_prod`
  MODIFY `id_areap` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `tm_caja`
--
ALTER TABLE `tm_caja`
  MODIFY `id_caja` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `tm_cliente`
--
ALTER TABLE `tm_cliente`
  MODIFY `id_cliente` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `tm_compra`
--
ALTER TABLE `tm_compra`
  MODIFY `id_compra` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tm_compra_credito`
--
ALTER TABLE `tm_compra_credito`
  MODIFY `id_credito` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tm_empresa`
--
ALTER TABLE `tm_empresa`
  MODIFY `id_de` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `tm_gastos_adm`
--
ALTER TABLE `tm_gastos_adm`
  MODIFY `id_ga` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tm_impresora`
--
ALTER TABLE `tm_impresora`
  MODIFY `id_imp` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `tm_ingresos_adm`
--
ALTER TABLE `tm_ingresos_adm`
  MODIFY `id_ing` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tm_insumo`
--
ALTER TABLE `tm_insumo`
  MODIFY `id_ins` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tm_insumo_catg`
--
ALTER TABLE `tm_insumo_catg`
  MODIFY `id_catg` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tm_inventario`
--
ALTER TABLE `tm_inventario`
  MODIFY `id_inv` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=71;

--
-- AUTO_INCREMENT de la tabla `tm_inventario_entsal`
--
ALTER TABLE `tm_inventario_entsal`
  MODIFY `id_es` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tm_margen_venta`
--
ALTER TABLE `tm_margen_venta`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `tm_mesa`
--
ALTER TABLE `tm_mesa`
  MODIFY `id_mesa` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tm_pedido`
--
ALTER TABLE `tm_pedido`
  MODIFY `id_pedido` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tm_producto`
--
ALTER TABLE `tm_producto`
  MODIFY `id_prod` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `tm_producto_catg`
--
ALTER TABLE `tm_producto_catg`
  MODIFY `id_catg` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT de la tabla `tm_producto_ingr`
--
ALTER TABLE `tm_producto_ingr`
  MODIFY `id_pi` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tm_producto_pres`
--
ALTER TABLE `tm_producto_pres`
  MODIFY `id_pres` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `tm_proveedor`
--
ALTER TABLE `tm_proveedor`
  MODIFY `id_prov` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tm_rol`
--
ALTER TABLE `tm_rol`
  MODIFY `id_rol` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `tm_salon`
--
ALTER TABLE `tm_salon`
  MODIFY `id_catg` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tm_tienda`
--
ALTER TABLE `tm_tienda`
  MODIFY `id_tie` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `tm_tipo_compra`
--
ALTER TABLE `tm_tipo_compra`
  MODIFY `id_tipo_compra` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `tm_tipo_doc`
--
ALTER TABLE `tm_tipo_doc`
  MODIFY `id_tipo_doc` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `tm_tipo_gasto`
--
ALTER TABLE `tm_tipo_gasto`
  MODIFY `id_tipo_gasto` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `tm_tipo_medida`
--
ALTER TABLE `tm_tipo_medida`
  MODIFY `id_med` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `tm_tipo_pago`
--
ALTER TABLE `tm_tipo_pago`
  MODIFY `id_tipo_pago` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `tm_tipo_pedido`
--
ALTER TABLE `tm_tipo_pedido`
  MODIFY `id_tipo_pedido` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `tm_tipo_venta`
--
ALTER TABLE `tm_tipo_venta`
  MODIFY `id_tipo_venta` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `tm_turno`
--
ALTER TABLE `tm_turno`
  MODIFY `id_turno` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `tm_usuario`
--
ALTER TABLE `tm_usuario`
  MODIFY `id_usu` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `tm_venta`
--
ALTER TABLE `tm_venta`
  MODIFY `id_venta` int(11) NOT NULL AUTO_INCREMENT;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `tm_aper_cierre`
--
ALTER TABLE `tm_aper_cierre`
  ADD CONSTRAINT `FK_ac_caja` FOREIGN KEY (`id_caja`) REFERENCES `tm_caja` (`id_caja`),
  ADD CONSTRAINT `FK_ac_turno` FOREIGN KEY (`id_turno`) REFERENCES `tm_turno` (`id_turno`),
  ADD CONSTRAINT `FK_ac_usu` FOREIGN KEY (`id_usu`) REFERENCES `tm_usuario` (`id_usu`);

--
-- Filtros para la tabla `tm_area_prod`
--
ALTER TABLE `tm_area_prod`
  ADD CONSTRAINT `FK_AP_IMP` FOREIGN KEY (`id_imp`) REFERENCES `tm_impresora` (`id_imp`);

--
-- Filtros para la tabla `tm_compra`
--
ALTER TABLE `tm_compra`
  ADD CONSTRAINT `FK_comp_prov` FOREIGN KEY (`id_prov`) REFERENCES `tm_proveedor` (`id_prov`),
  ADD CONSTRAINT `FK_comp_tipoc` FOREIGN KEY (`id_tipo_compra`) REFERENCES `tm_tipo_compra` (`id_tipo_compra`),
  ADD CONSTRAINT `FK_comp_tipod` FOREIGN KEY (`id_tipo_doc`) REFERENCES `tm_tipo_doc` (`id_tipo_doc`),
  ADD CONSTRAINT `FK_comp_usu` FOREIGN KEY (`id_usu`) REFERENCES `tm_usuario` (`id_usu`);

--
-- Filtros para la tabla `tm_compra_credito`
--
ALTER TABLE `tm_compra_credito`
  ADD CONSTRAINT `FK_compcre_idcomp` FOREIGN KEY (`id_compra`) REFERENCES `tm_compra` (`id_compra`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Filtros para la tabla `tm_compra_detalle`
--
ALTER TABLE `tm_compra_detalle`
  ADD CONSTRAINT `FK_CDET_COM` FOREIGN KEY (`id_compra`) REFERENCES `tm_compra` (`id_compra`);

--
-- Filtros para la tabla `tm_credito_detalle`
--
ALTER TABLE `tm_credito_detalle`
  ADD CONSTRAINT `FK_CRED_CRED` FOREIGN KEY (`id_credito`) REFERENCES `tm_compra_credito` (`id_credito`),
  ADD CONSTRAINT `FK_cred_usu` FOREIGN KEY (`id_usu`) REFERENCES `tm_usuario` (`id_usu`);

--
-- Filtros para la tabla `tm_detalle_pedido`
--
ALTER TABLE `tm_detalle_pedido`
  ADD CONSTRAINT `FK_DPED_PED` FOREIGN KEY (`id_pedido`) REFERENCES `tm_pedido` (`id_pedido`),
  ADD CONSTRAINT `FK_DPED_PRES` FOREIGN KEY (`id_pres`) REFERENCES `tm_producto_pres` (`id_pres`);

--
-- Filtros para la tabla `tm_detalle_venta`
--
ALTER TABLE `tm_detalle_venta`
  ADD CONSTRAINT `FK_DVEN_VEN` FOREIGN KEY (`id_venta`) REFERENCES `tm_venta` (`id_venta`);

--
-- Filtros para la tabla `tm_gastos_adm`
--
ALTER TABLE `tm_gastos_adm`
  ADD CONSTRAINT `FK_EADM_APC` FOREIGN KEY (`id_apc`) REFERENCES `tm_aper_cierre` (`id_apc`),
  ADD CONSTRAINT `FK_EADM_TDOC` FOREIGN KEY (`id_tipo_doc`) REFERENCES `tm_tipo_doc` (`id_tipo_doc`),
  ADD CONSTRAINT `FK_EADM_TGAS` FOREIGN KEY (`id_tipo_gasto`) REFERENCES `tm_tipo_gasto` (`id_tipo_gasto`),
  ADD CONSTRAINT `FK_EADM_USU` FOREIGN KEY (`id_usu`) REFERENCES `tm_usuario` (`id_usu`);

--
-- Filtros para la tabla `tm_ingresos_adm`
--
ALTER TABLE `tm_ingresos_adm`
  ADD CONSTRAINT `FK_IADM_APC` FOREIGN KEY (`id_apc`) REFERENCES `tm_aper_cierre` (`id_apc`),
  ADD CONSTRAINT `FK_IADM_USU` FOREIGN KEY (`id_usu`) REFERENCES `tm_usuario` (`id_usu`);

--
-- Filtros para la tabla `tm_insumo`
--
ALTER TABLE `tm_insumo`
  ADD CONSTRAINT `FK_ins_catg` FOREIGN KEY (`id_catg`) REFERENCES `tm_insumo_catg` (`id_catg`),
  ADD CONSTRAINT `FK_ins_med` FOREIGN KEY (`id_med`) REFERENCES `tm_tipo_medida` (`id_med`);

--
-- Filtros para la tabla `tm_inventario_entsal`
--
ALTER TABLE `tm_inventario_entsal`
  ADD CONSTRAINT `FK_INVES_USU` FOREIGN KEY (`id_usu`) REFERENCES `tm_usuario` (`id_usu`);

--
-- Filtros para la tabla `tm_mesa`
--
ALTER TABLE `tm_mesa`
  ADD CONSTRAINT `FK_mesa_catg` FOREIGN KEY (`id_catg`) REFERENCES `tm_salon` (`id_catg`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Filtros para la tabla `tm_pedido`
--
ALTER TABLE `tm_pedido`
  ADD CONSTRAINT `FK_ped_tp` FOREIGN KEY (`id_tipo_pedido`) REFERENCES `tm_tipo_pedido` (`id_tipo_pedido`),
  ADD CONSTRAINT `FK_ped_usu` FOREIGN KEY (`id_usu`) REFERENCES `tm_usuario` (`id_usu`);

--
-- Filtros para la tabla `tm_pedido_delivery`
--
ALTER TABLE `tm_pedido_delivery`
  ADD CONSTRAINT `FK_peddel_ped` FOREIGN KEY (`id_pedido`) REFERENCES `tm_pedido` (`id_pedido`);

--
-- Filtros para la tabla `tm_pedido_llevar`
--
ALTER TABLE `tm_pedido_llevar`
  ADD CONSTRAINT `FK_pedlle_ped` FOREIGN KEY (`id_pedido`) REFERENCES `tm_pedido` (`id_pedido`);

--
-- Filtros para la tabla `tm_pedido_mesa`
--
ALTER TABLE `tm_pedido_mesa`
  ADD CONSTRAINT `FK_pedme_mesa` FOREIGN KEY (`id_mesa`) REFERENCES `tm_mesa` (`id_mesa`),
  ADD CONSTRAINT `FK_pedme_mozo` FOREIGN KEY (`id_mozo`) REFERENCES `tm_usuario` (`id_usu`),
  ADD CONSTRAINT `FK_pedme_ped` FOREIGN KEY (`id_pedido`) REFERENCES `tm_pedido` (`id_pedido`);

--
-- Filtros para la tabla `tm_producto`
--
ALTER TABLE `tm_producto`
  ADD CONSTRAINT `FK_prod_area` FOREIGN KEY (`id_areap`) REFERENCES `tm_area_prod` (`id_areap`),
  ADD CONSTRAINT `FK_prod_catg` FOREIGN KEY (`id_catg`) REFERENCES `tm_producto_catg` (`id_catg`);

--
-- Filtros para la tabla `tm_producto_ingr`
--
ALTER TABLE `tm_producto_ingr`
  ADD CONSTRAINT `FK_PING_MED` FOREIGN KEY (`id_med`) REFERENCES `tm_tipo_medida` (`id_med`),
  ADD CONSTRAINT `FK_PING_PRES` FOREIGN KEY (`id_pres`) REFERENCES `tm_producto_pres` (`id_pres`);

--
-- Filtros para la tabla `tm_producto_pres`
--
ALTER TABLE `tm_producto_pres`
  ADD CONSTRAINT `FK_PROP_PROD` FOREIGN KEY (`id_prod`) REFERENCES `tm_producto` (`id_prod`);

--
-- Filtros para la tabla `tm_usuario`
--
ALTER TABLE `tm_usuario`
  ADD CONSTRAINT `FK_usu_rol` FOREIGN KEY (`id_rol`) REFERENCES `tm_rol` (`id_rol`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Filtros para la tabla `tm_venta`
--
ALTER TABLE `tm_venta`
  ADD CONSTRAINT `FK_venta_apc` FOREIGN KEY (`id_apc`) REFERENCES `tm_aper_cierre` (`id_apc`),
  ADD CONSTRAINT `FK_venta_cli` FOREIGN KEY (`id_cliente`) REFERENCES `tm_cliente` (`id_cliente`),
  ADD CONSTRAINT `FK_venta_ped` FOREIGN KEY (`id_pedido`) REFERENCES `tm_pedido` (`id_pedido`),
  ADD CONSTRAINT `FK_venta_td` FOREIGN KEY (`id_tipo_doc`) REFERENCES `tm_tipo_doc` (`id_tipo_doc`),
  ADD CONSTRAINT `FK_venta_tp` FOREIGN KEY (`id_tipo_pago`) REFERENCES `tm_tipo_pago` (`id_tipo_pago`),
  ADD CONSTRAINT `FK_venta_tpe` FOREIGN KEY (`id_tipo_pedido`) REFERENCES `tm_tipo_pedido` (`id_tipo_pedido`),
  ADD CONSTRAINT `FK_venta_usu` FOREIGN KEY (`id_usu`) REFERENCES `tm_usuario` (`id_usu`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
