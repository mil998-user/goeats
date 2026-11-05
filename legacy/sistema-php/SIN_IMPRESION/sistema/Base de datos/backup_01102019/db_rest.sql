-- phpMyAdmin SQL Dump
-- version 4.5.1
-- http://www.phpmyadmin.net
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 01-10-2019 a las 23:22:56
-- Versión del servidor: 10.1.10-MariaDB
-- Versión de PHP: 5.6.19

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
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
CREATE   PROCEDURE `usp_cajaAperturar` (IN `_flag` INT(11), IN `_idTie` INT(11), IN `_idUsu` INT(11), IN `_idCaja` INT(11), IN `_idTurno` INT(11), IN `_fechaA` DATETIME, IN `_montoA` DECIMAL(10,2))  BEGIN
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

CREATE   PROCEDURE `usp_cajaCerrar` (IN `_flag` INT(11), IN `_idApc` INT(11), IN `_fechaC` DATETIME, IN `_montoC` DECIMAL(10,2), IN `_montoS` DECIMAL(10,2))  BEGIN
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

CREATE   PROCEDURE `usp_comprasAnular` (IN `_flag` INT(11), IN `_idCom` INT(11))  BEGIN
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

CREATE   PROCEDURE `usp_comprasContado` (IN `_flag` INT(11), IN `_idProv` INT(11), IN `_idTc` INT(11), IN `_idTd` INT(11), IN `_idUsu` INT(11), IN `_fechaC` DATE, IN `_horaC` VARCHAR(45), IN `_serieD` VARCHAR(45), IN `_numD` VARCHAR(45), IN `_igv` DECIMAL(10,2), IN `_total` DECIMAL(10,2), IN `_desc` DECIMAL(10,2), IN `_obs` VARCHAR(100))  BEGIN
	IF _flag = 1 THEN
	
		INSERT INTO tm_compra (id_prov,id_tipo_compra,id_tipo_doc,id_usu,fecha_c,hora_c,serie_doc,num_doc,igv,total,descuento,observaciones)
		VALUES (_idProv, _idTc, _idTd, _idUsu, _fechaC, _horaC, _serieD, _numD, _igv, _total, _desc, _obs);
		
		SELECT @@IDENTITY INTO @id;
		
	END IF;
END$$

CREATE   PROCEDURE `usp_comprasCreditoCuotas` (IN `_flag` INT(11), IN `_idCre` INT(11), IN `_idUsu` INT(11), IN `_idApc` INT(11), IN `_imp` DECIMAL(10,2), IN `_fecha` DATETIME, IN `_egCaja` INT(11), IN `_montC` DECIMAL(10,2), IN `_amorC` DECIMAL(10,2), IN `_totalC` DECIMAL(10,2))  BEGIN
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

CREATE   PROCEDURE `usp_comprasRegProveedor` (IN `_flag` INT(11), IN `_ruc` VARCHAR(13), IN `_razS` VARCHAR(100), IN `_direc` VARCHAR(100), IN `_telf` INT(9), IN `_email` VARCHAR(45), IN `_contc` VARCHAR(45), IN `_idProv` INT(11))  BEGIN
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

CREATE   PROCEDURE `usp_configAlmacenes` (IN `_flag` INT(11), IN `_nombre` VARCHAR(45), IN `_estado` VARCHAR(5), IN `_idAlm` INT(11))  BEGIN
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

CREATE   PROCEDURE `usp_configAreasProd` (IN `_flag` INT(11), IN `_idImp` INT(11), IN `_nombre` VARCHAR(45), IN `_estado` VARCHAR(5), IN `_idArea` INT(11))  BEGIN
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

CREATE   PROCEDURE `usp_configCajas` (IN `_flag` INT(11), IN `_nombre` VARCHAR(45), IN `_estado` VARCHAR(5), IN `_idCaja` INT(11))  BEGIN
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

CREATE   PROCEDURE `usp_configEliminarCategoriaIns` (IN `_id_catg` INT(11))  BEGIN
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

CREATE   PROCEDURE `usp_configEliminarCategoriaProd` (IN `_id_catg` INT(11))  BEGIN
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

CREATE   PROCEDURE `usp_configImpresoras` (IN `_flag` INT(11), IN `_nombre` VARCHAR(50), IN `_estado` VARCHAR(5), IN `_idImp` INT(11))  BEGIN
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

CREATE   PROCEDURE `usp_configInsumo` (IN `_flag` INT(11), IN `_idCatg` INT(11), IN `_idMed` INT(11), IN `_cod` VARCHAR(10), IN `_nombre` VARCHAR(45), IN `_stock` INT(11), IN `_costo` DECIMAL(10,2), IN `_estado` VARCHAR(5), IN `_idIns` INT(11))  BEGIN
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

CREATE   PROCEDURE `usp_configInsumoCatgs` (IN `_flag` INT(11), IN `_descC` VARCHAR(45), IN `_idCatg` INT(11))  BEGIN
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

CREATE   PROCEDURE `usp_configMesas` (IN `_flag` INT(11), IN `_idCatg` INT(11), IN `_nroMesa` VARCHAR(5), IN `_idMesa` INT(11))  BEGIN
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

CREATE   PROCEDURE `usp_configProducto` (IN `_flag` INT(11), IN `_idTipo` INT(11), IN `_idCatg` INT(11), IN `_idArea` INT(11), IN `_nombP` VARCHAR(45), IN `_descP` VARCHAR(200), IN `_estado` VARCHAR(45), IN `_idProd` INT(11))  BEGIN
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

CREATE   PROCEDURE `usp_configProductoCatgs` (IN `_flag` INT(11), IN `_descC` VARCHAR(45), IN `_idCatg` INT(11))  BEGIN	
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

CREATE   PROCEDURE `usp_configProductoIngrs` (IN `_flag` INT(11), IN `_idPres` INT(11), IN `_idTIns` INT(11), IN `_idIns` INT(11), IN `_idMed` INT(11), IN `_cant` FLOAT, IN `_idPi` INT(11))  BEGIN
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

CREATE   PROCEDURE `usp_configProductoPres` (IN `_flag` INT(11), IN `_idProd` INT(11), IN `_codP` VARCHAR(45), IN `_presP` VARCHAR(45), IN `_precio` DECIMAL(10,2), IN `_rec` INT(1), IN `_stock` INT(11), IN `_estado` VARCHAR(5), IN `_img` VARCHAR(200), IN `_idPres` INT(1))  BEGIN
		
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

CREATE   PROCEDURE `usp_configRol` (IN `_flag` INT(11), IN `_desc` VARCHAR(45), IN `_idRol` INT(11))  BEGIN
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

CREATE   PROCEDURE `usp_configSalones` (IN `_flag` INT(11), IN `_desc` VARCHAR(45), IN `_est` VARCHAR(5), IN `_idCatg` INT(11))  BEGIN
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

CREATE   PROCEDURE `usp_configTiendas` (IN `_flag` INT(11), IN `_nomb` VARCHAR(100), IN `_direc` VARCHAR(200), IN `_telef` VARCHAR(20), IN `_est` VARCHAR(5), IN `_idTie` INT(11))  BEGIN
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

CREATE   PROCEDURE `usp_configUsuario` (IN `_flag` INT(11), IN `_idTie` INT(11), IN `_idRol` INT(11), IN `_idArea` INT(11), IN `_dni` VARCHAR(10), IN `_apeP` VARCHAR(45), IN `_apeM` VARCHAR(45), IN `_nomb` VARCHAR(45), IN `_email` VARCHAR(100), IN `_usu` VARCHAR(45), IN `_cont` VARCHAR(45), IN `_img` VARCHAR(45), IN `_idUsu` INT(11))  BEGIN
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

CREATE   PROCEDURE `usp_invESAnular` (IN `_flag` INT(11), IN `_idEs` INT(11), IN `_idTo` INT(11))  BEGIN
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

CREATE   PROCEDURE `usp_restCambiarMesa` (IN `_flag` INT(11), IN `_codMO` INT(11), IN `_codMD` INT(11))  BEGIN
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

CREATE   PROCEDURE `usp_restCancelarPedido` (IN `_flag` INT(11), IN `_codPed` INT(11), IN `_codPro` INT(11), IN `_fechaPed` DATETIME)  BEGIN
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

CREATE   PROCEDURE `usp_restDesocuparMesa` (`_flag` INT(11), `_idPed` INT(11))  BEGIN
		DECLARE result INT DEFAULT 1;
		IF _flag = 1 THEN
			SELECT id_mesa INTO @codmesa FROM tm_pedido_mesa WHERE id_pedido = _idPed;
			UPDATE tm_mesa SET estado = 'a' WHERE id_mesa = @codmesa;
			UPDATE tm_pedido SET estado = 'i' WHERE id_pedido = _idPed;
			SELECT result AS resultado;
		END IF;
	END$$

CREATE   PROCEDURE `usp_restEmitirVenta` (`_flag` INT(11), `_idDP` INT(11), `_idTE` INT(11), `_idPed` INT(11), `_idCli` INT(11), `_idTp` INT(11), `_idTd` INT(11), `_idUsu` INT(11), `_idApc` INT(11), `_pagoTar` DECIMAL(10,2), `_dscto` DECIMAL(10,2), `_bolsa` DECIMAL(10,2), `_igv` DECIMAL(10,2), `_total` DECIMAL(10,2), `_fecha` DATETIME)  BEGIN
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

CREATE   PROCEDURE `usp_restEmitirVentaDet` (`_flag` INT(11), `_idVen` INT(11), `_idPed` INT(11), `_fecha` DATETIME)  BEGIN
    
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

CREATE   PROCEDURE `usp_restRegCliente` (IN `_flag` INT(11), IN `_dni` VARCHAR(10), IN `_ruc` VARCHAR(13), IN `_apeP` VARCHAR(45), IN `_apeM` VARCHAR(45), IN `_nomb` VARCHAR(100), IN `_razS` VARCHAR(100), IN `_telf` INT(11), IN `_fecN` DATE, IN `_correo` VARCHAR(100), IN `_direc` VARCHAR(100), IN `_idCliente` INT(11))  BEGIN
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

CREATE   PROCEDURE `usp_restRegDelivery` (IN `_flag` INT(11), IN `_idTp` INT(11), IN `_idUsu` INT(11), IN `_fechaP` DATETIME, IN `_nombC` VARCHAR(100), IN `_dirC` VARCHAR(100), IN `_telfC` VARCHAR(20), IN `_comen` VARCHAR(100))  BEGIN
	IF _flag = 1 THEN
		
		INSERT INTO tm_pedido (id_tipo_pedido,id_usu,fecha_pedido)
		VALUES (_idTp, _idUsu, _fechaP);
		
		SELECT @@IDENTITY INTO @id;
		
		SELECT CONCAT(LPAD(COUNT(id_pedido)+1,5,'0')) AS codigo INTO @nro_pedido FROM tm_pedido_delivery;
		
		INSERT INTO tm_pedido_delivery (id_pedido,nro_pedido,nomb_cliente,direccion,telefono,comentario)
		VALUES (@id, @nro_pedido, _nombC, _dirC, _telfC, _comen);
		
		SELECT @id AS cod;
	
	END IF;
    END$$

CREATE   PROCEDURE `usp_restRegMesa` (IN `_flag` INT(11), IN `_idMesa` INT(11), IN `_idTp` INT(11), IN `_idUsu` INT(11), IN `_idMoso` INT(11), IN `_fechaP` DATETIME, IN `_nombC` VARCHAR(45), IN `_comen` VARCHAR(100))  BEGIN
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

CREATE   PROCEDURE `usp_restRegMostrador` (IN `_flag` INT(11), IN `_idTp` INT(11), IN `_idUsu` INT(11), IN `_fechaP` DATETIME, IN `_nombC` VARCHAR(45), IN `_comen` VARCHAR(100))  BEGIN
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

CREATE   PROCEDURE `usp_tableroControl` (IN `_flag` INT(11), IN `_codDia` INT(11), IN `_fecha` DATE, IN `_feSei` DATE, IN `_feCin` DATE, IN `_feCua` DATE, IN `_feTre` DATE, IN `_feDos` DATE, IN `_feUno` DATE)  BEGIN
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

CREATE   PROCEDURE `vsp_clientes` ()  BEGIN
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
  `monto_aper` decimal(10,2) DEFAULT '0.00',
  `fecha_cierre` datetime DEFAULT NULL,
  `monto_cierre` decimal(10,2) DEFAULT '0.00',
  `monto_sistema` decimal(10,2) DEFAULT '0.00',
  `estado` varchar(5) DEFAULT 'a'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Volcado de datos para la tabla `tm_aper_cierre`
--

INSERT INTO `tm_aper_cierre` (`id_apc`, `id_tie`, `id_usu`, `id_caja`, `id_turno`, `fecha_aper`, `monto_aper`, `fecha_cierre`, `monto_cierre`, `monto_sistema`, `estado`) VALUES
(1, 1, 1, 1, 2, '2019-07-31 15:44:12', '1.00', '2019-08-17 17:15:00', '512.51', '513.51', 'c'),
(2, 1, 1, 1, 2, '2019-08-19 20:13:31', '10.00', '2019-09-23 15:19:00', '100.00', '-470.80', 'c'),
(3, 1, 3, 1, 2, '2019-08-22 18:39:13', '100.00', '2019-09-23 15:20:00', '100.00', '169.00', 'c'),
(4, 1, 1, 1, 2, '2019-09-23 15:21:23', '100.00', '2019-09-23 19:31:00', '100.00', '100.00', 'c'),
(5, 1, 3, 1, 2, '2019-09-23 15:22:11', '100.00', '2019-09-23 19:32:00', '200.00', '100.00', 'c'),
(6, 1, 1, 1, 2, '2019-09-23 19:32:44', '100.00', '2019-09-23 19:33:00', '300.00', '100.00', 'c'),
(7, 1, 1, 1, 2, '2019-09-23 19:34:27', '500.00', '2019-09-23 19:34:00', '500.00', '500.00', 'c'),
(8, 1, 3, 1, 2, '2019-09-23 19:36:05', '100.00', '2019-09-23 19:36:00', '100.00', '100.00', 'c'),
(9, 1, 1, 1, 2, '2019-09-23 19:41:01', '1.00', NULL, '0.00', '0.00', 'a');

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
(1, '********', '***********', 'EN', 'GENERAL', 'PUBLICO', '', NULL, '0000-00-00', NULL, 'SIN DIRECCION', 'a'),
(2, '00111121', '', 'NUÑEZ', 'SANCHEZ', 'JOSE MANUEL', '', 0, '1970-01-01', '', '-', 'a'),
(3, '45645692', '10456456923', '', '', '', 'RIOS RUIZ FERNANDO', 0, '1970-01-01', '', '-', 'a'),
(4, '', '20131370301', '', '', '', 'MINISTERIO PUBLICO-GERENCIA GENERAL', 0, '1970-01-01', '', 'AV. ABANCAY NRO. 491 (SEGUNDO PISO-GERENCIA DE TESORERIA)', 'a'),
(5, '', '20148316148', '', '', '', 'ASOC SUB OFICIALES TEC Y ESP PNP ASS PNP', 0, '1970-01-01', '', 'JR. CORONEL JOSE DIAZ NRO. 202 URB.  SANTA BAEATRIZ  (FRENTE ESTADIO NAC.LADO NORTE)', 'a'),
(6, '', '20454197209', '', '', '', 'DISTRIBUIDORA DROGUERIA PHRYMA S.A.C.', 0, '1970-01-01', '', 'CAL.ALTO DE LA LUNA NRO. 300 URB.  CERCADO', 'a'),
(7, '', '20602959903', '', '', '', 'CORPORACION DEDO´S S.A.C.', 0, '1970-01-01', '', 'JR. SALAVERRY NRO. 591 (AL COSTADO DEL GIMNASIO OTAWA)', 'a'),
(8, '00116313', '', 'LOZANO', 'LOPEZ', 'HOMAR', '', 0, '1970-01-01', '', '-', 'a'),
(9, '', '20192055416', '', '', '', 'ZONA REGISTRAL N°VI- SEDE PUCALLPA', 0, '1970-01-01', '', 'JR. PROGRESO NRO. 150', 'a'),
(10, '', '20604269068', '', '', '', 'RENTA CAR G Y G E.I.R.L.', 0, '1970-01-01', '', 'CAL.3 MZA. E LOTE. 3 (ESPALDAL DE LA CANCHA DE ARCEO)', 'a'),
(11, '00114335', '10001143358', '', '', '', 'PERALTA MOZOMBITE JHONNY JHON', 0, '1970-01-01', '', '-', 'a'),
(12, '21453608', '10214536086', '', '', '', 'ESPINOZA SAIRITUPAC LAZARO EDGARD', 0, '1970-01-01', '', '-', 'a'),
(13, '', '20100244471', '', '', '', 'SOCIEDAD ANONIMA FAUSTO PIAGGIO', 0, '1970-01-01', '', 'AV. ARGENTINA NRO. 4792 URB.  PARQUE INTERNACIONAL DE INDUSTRIA Y COMERCIO  PROV. CONST. DEL', 'a'),
(14, '', '20470407442', '', '', '', 'MUR - WY S.A.C.', 0, '1970-01-01', '', 'AV. MALECÓN CHECA NRO. 3777 URB.  CAMPOY', 'a'),
(15, '44419621', '', 'ARMAS', 'ACUÑA', 'JUAN CARLOS', '', 0, '1970-01-01', '', '-', 'a'),
(16, '48066999', '', 'MORI', 'LA TORRE', 'JOSE ANTONIO', '', 0, '1970-01-01', '', '-', 'a'),
(17, '00062929', '', 'DONAYRE', 'AREVALO', 'JOSE LUIS', '', 0, '1970-01-01', '', '-', 'a'),
(18, '', '20478053178', '', '', '', 'SERVICIO NACIONAL DE AREAS NATURALES PROTEGIDAS POR EL ESTADO - SERNANP', 0, '1970-01-01', '', 'CAL.LOS PETIRROJOS NRO. 355 URB.  EL PALOMAR  (AV PABLO CARRAQUIRY Y CAL LOS PETIRROJOS)', 'a'),
(19, '44240064', '10442400640', '', '', '', 'CHAVEZ DIAZ JUAN CARLOS', 0, '1970-01-01', '', '-', 'a'),
(20, '', '20232953421', '', '', '', 'MUNICIPALIDAD DISTRITAL DE CURIMAMA', 0, '1970-01-01', '', 'AV. CURIMANA NRO. S/N', 'a'),
(21, '41868097', '', 'TALAVERA', 'JIMENEZ', 'PATRICIA LEONOR', '', 0, '1970-01-01', '', '-', 'a'),
(22, '41876879', '', 'RUIZ', 'SANCHEZ', 'MILUSKA LISBETH', '', 0, '1970-01-01', '', '-', 'a'),
(23, '', '20393126460', '', '', '', 'COMITE DE ADMINISTRACION DEL FONDO DE ASISTENCIA Y ESTIMULO-CAFAE DE LA DIREC. REG.SECT.TRANSP.CUMUN', 0, '1970-01-01', '', 'JR. ZARUMILLA NRO. 127', 'a'),
(24, '', '20393161966', '', '', '', 'RENTA CAR GRAN PRIX S.R.L', 0, '1970-01-01', '', 'JR. AUGUSTO B.LEGUIA NRO. 119 (POR EL COLEGIO BAUTISTA)', 'a'),
(25, '42549924', '', 'RAMIREZ', 'ORDOÑEZ', 'GINO AMNER', '', 0, '1970-01-01', '', '-', 'a'),
(26, '', '20543254798', '', '', '', 'VIETTEL  PERU  S.A.C.', 0, '1970-01-01', '', 'CAL.21 NRO. 878 URB.  CORPAC', 'a'),
(27, '', '20154572792', '', '', '', 'MUNICIPALIDAD PROV.DE CORONEL PORTILLO', 0, '1970-01-01', '', 'JR. TACNA NRO. 480 RES.  PUCALLPA  (FRENTE A LA PLAZA DE ARMAS)', 'a'),
(28, '41448158', '10414481588', '', '', '', 'REATEGUI VASQUEZ JOHNNY JACK', 0, '1970-01-01', '', '-', 'a'),
(29, '', '20601616204', '', '', '', 'GRUPO FERRETERO SAN JOSE S.R.L.', 0, '1970-01-01', '', 'JR. 7 DE JUNIO NRO. 726 URB.  CERCADO DE PUCALLPA', 'a'),
(30, '', '20602332862', '', '', '', 'RS MARKETING Y PUBLICIDAD S.A.C.', 0, '1970-01-01', '', 'JR. ABRAHAM VALDELOMAR MZA. B LOTE. 16 (A 4 CDRS DEL PARQUE LA LUPUNA)', 'a'),
(31, '21145897', '10211458971', '', '', '', 'DEL AGUILA APUELA HUGO', 0, '1970-01-01', '', '-', 'a'),
(32, '', '20528292918', '', '', '', 'UNIDAD DE GESTION EDUCATIVA LOCAL DATEM DEL MARAÑON', 0, '1970-01-01', '', 'JR. PASTAZA NRO. 224 (FRENTE A PLAZA DE ARMAS)  LORETO', 'a'),
(33, '', '20602920641', '', '', '', 'PEOPLE AND ENVIRONMENT CONSULTING E.I.R.L.', 0, '1970-01-01', '', 'JR. VICTOR MONTALVO NRO. 321 (POR EL MERCADO  3)', 'a'),
(34, '', '20100717124', '', '', '', 'PROTECCION Y RESGUARDO S A', 0, '1970-01-01', '', 'CAL.JUAN BIELOVUCICH NRO. 1405 (J.BIELOVUCICH 1411 ALT.CDRA.20 SALAVERRY)', 'a'),
(35, '45870259', '', 'LOZANO', 'DIAZ', 'JENNIFFER', '', 0, '1970-01-01', '', '-', 'a'),
(36, '40059616', '', 'NOLORBE', 'JERI', 'NADIA MABEL', '', 0, '1970-01-01', '', '-', 'a'),
(37, '40166886', '10401668867', '', '', '', 'RIOS CARDENAS MIRIAM MAGALY', 0, '1970-01-01', '', '-', 'a'),
(38, '40940180', '', 'SATO', 'RUIZ', 'SILVIA TAMIKO', '', 0, '1970-01-01', '', '-', 'a'),
(39, '', '20603955316', '', '', '', 'CONSORCIO CARRETERO EL SHIRINGAL', 0, '1970-01-01', '', 'CAL.BASILIO RAMIREZ PEÑA NRO. 491 INT. 401 COO.  SIMA', 'a'),
(40, '', '20393063956', '', '', '', 'INDUSTRIAS TRICAR S.A.C.', 0, '1970-01-01', '', 'AV. SHIRAMBARI MZA. FRU LOTE. A2 (A 300 METROS UNU)', 'a'),
(41, '', '20450940811', '', '', '', 'UNIDAD DE GESTION EDUCATIVA UCAYALI - CONTAMANA', 0, '1970-01-01', '', 'CAL.BUENAVENTURA MARQUEZ NRO. S/N (CDRA 1)', 'a'),
(42, '', '20261430470', '', '', '', 'PROFONANPE', 0, '1970-01-01', '', 'AV. JAVIER PRADO OESTE NRO. 2378 URB.  SANTA ROSA  (A 1 CDRA. RESIDENCIA EMBAJADA DE JAPÓN)', 'a'),
(43, '', '20198298710', '', '', '', 'MUNICIPALIDAD DISTRITAL DE PADRE MARQUEZ', 0, '1970-01-01', '', 'JR. 28 DE JULIO NRO. S/N CAS.  TIRUNTAN  (CENTRO POBLADO TIRUNTAN)', 'a'),
(44, '', '20304269759', '', '', '', 'LUCKY S.A.C.', 0, '1970-01-01', '', 'JR. GNRAL MANUEL DE MENDIBURU NRO. 1230 INT. 102 URB.  SANTA CRUZ  (ALT.CDRA 12 AV. EJERCITO)', 'a'),
(45, '00034010', '', 'DAVILA', 'TUANAMA', 'RODOLFO', '', 0, '1970-01-01', '', '-', 'a'),
(46, '00009676', '10000096763', '', '', '', 'FLORES QUISPE FRANCISCO', 0, '1970-01-01', '', '-', 'a'),
(47, '', '20109980855', '', '', '', 'GRIFO DENNIS S.A.C.', 0, '1970-01-01', '', 'AV. DEL PINAR NRO. 180 INT. 1002 URB.  CHACARILLA DEL ESTANQUE  (AV. PRIMAVERA, ENTRE CUADRAS 3 Y 4)', 'a'),
(48, '', '20600144589', '', '', '', 'DEBARDALES OUTSOURCING EMPRESARIAL E.I.R.L.', 0, '1970-01-01', '', 'JR. IPARIA MZA. 44 LOTE. 6A (FRENTE AL HOTEL LAS ORQUIDEAS)', 'a'),
(49, '', '20423555182', '', '', '', 'CIA IMPORTADORA AMERICANA S.A.', 0, '1970-01-01', '', 'JR. CESAR VALLEJO NRO. 1345 URB.  LAS PALMAS REALES  (2DO PISO)', 'a'),
(50, '00081768', '', 'RIOS', 'LANARO', 'TEDDY', '', 0, '1970-01-01', '', '-', 'a'),
(51, '', '20550154065', '', '', '', 'PROGRAMA NACIONAL DE ALIMENTACIÓN ESCOLAR QALI WARMA', 0, '1970-01-01', '', 'AV. CIRCUNVALACION CLUB EL GOLF LOS INKAS NRO. 208 (PISO 13-JAVIER PRADO ESTE)', 'a'),
(52, '00111486', '', 'GARCIA', 'SHUÑA', 'RUTH', '', 0, '1970-01-01', '', '-', 'a'),
(53, '41695375', '', 'MORENO', 'DIAZ DE MEZA', 'SILVIA KAROL', '', 0, '1970-01-01', '', '-', 'a'),
(54, '41459749', '', 'AGUILAR', 'ARBILDO', 'FRANK', '', 0, '1970-01-01', '', '-', 'a'),
(55, '40719185', '', 'GARCIA', 'SORIA', 'DIEGO GONZALO', '', 0, '1970-01-01', '', '-', 'a'),
(56, '', '20604414955', '', '', '', 'CONSORCIO CORPORACION JE & AC', 0, '1970-01-01', '', 'JR. ABTAO NRO. 810 (ESQUINA CON JR. GENERAL PRADO)', 'a'),
(57, '40407761', '10404077614', '', '', '', 'TRUJILLO CABALLERO EVA ELIZABETH', 0, '1970-01-01', '', '-', 'a'),
(58, '40494384', '10404943842', '', '', '', 'BARDALES BALAREZO KAREN', 0, '1970-01-01', '', '-', 'a'),
(59, '00095273', '', 'ACHO', 'TUANAMA', 'DINA ESTHER', '', 0, '1970-01-01', '', '-', 'a'),
(60, '00070129', '10000701292', '', '', '', 'ALVAREZ DAZA TERESITA DE JESUS', 0, '1970-01-01', '', '-', 'a'),
(61, '', '20416414018', '', '', '', 'L''OREAL PERU S.A.', 0, '1970-01-01', '', 'JR. MARISCAL LA MAR NRO. 991 DPTO. P-8', 'a'),
(62, '22511689', '', 'GARCIA', 'MARTIN', 'YONA LIZA', '', 0, '1970-01-01', '', '-', 'a'),
(63, '46992960', '', 'MANZUR', 'NOLORVE', 'FARID ANDREI', '', 0, '1970-01-01', '', '-', 'a'),
(64, '00087141', '10000871414', '', '', '', 'RIOS CORDOVA PABLO FERNANDO', 0, '1970-01-01', '', '-', 'a'),
(65, '10727313', '10107273137', '', '', '', 'RODRIGUEZ IQUE ISABEL DEL PILAR', 0, '1970-01-01', '', '-', 'a'),
(66, '46981202', '', 'PEREIRA', 'TORRES', 'GERSON OMAR', '', 0, '1970-01-01', '', '-', 'a'),
(67, '46024173', '10460241737', 'MELENDEZ', 'CASTRO', 'EDSON JUNIOR', 'MELENDEZ CASTRO EDSON JUNIOR', 0, '1970-01-01', '', '-', 'a'),
(68, '', '20521586134', 'PEREIRA', 'TORRES', 'GERSON OMAR', 'EVERIS PERU SOCIEDAD ANONIMA CERRADA', 0, '1970-01-01', '', 'CAL.DEAN VALDIVIA NRO. 148 URB.  JARDIN', 'a'),
(69, '44024396', '', 'USHIÑAHUA', 'AMASIFUEN', 'CARLOS TERCERO', '', 0, '1970-01-01', '', '-', 'a');

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

--
-- Volcado de datos para la tabla `tm_compra`
--

INSERT INTO `tm_compra` (`id_compra`, `id_prov`, `id_tipo_compra`, `id_tipo_doc`, `id_usu`, `fecha_c`, `hora_c`, `serie_doc`, `num_doc`, `igv`, `total`, `descuento`, `estado`, `observaciones`, `fecha_reg`) VALUES
(1, 4, 1, 2, 1, '2019-08-17', '12:00PM', '001', '122', '0.00', '20.00', '0.00', 'i', 'Ninguna', '2019-08-17 17:01:06'),
(2, 1, 2, 1, 1, '2019-08-17', '01:02PM', '001', '1222', '0.00', '6.00', '0.00', 'a', 'Ninguna', '2019-08-17 17:02:53'),
(3, 1, 1, 1, 1, '2019-08-22', '12:00PM', '001', '122', '0.00', '1.00', '0.00', 'a', 'Ninguna', '2019-08-22 17:03:36'),
(4, 2, 2, 2, 1, '2019-08-22', '01:00PM', '001', '1212', '0.00', '202.00', '0.00', 'a', 'Ninguna', '2019-08-22 17:04:53'),
(5, 2, 1, 1, 1, '2019-09-10', '12:00PM', '001', '122', '0.00', '1.00', '0.00', 'a', 'Ninguna', '2019-09-10 09:24:37');

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

--
-- Volcado de datos para la tabla `tm_compra_credito`
--

INSERT INTO `tm_compra_credito` (`id_credito`, `id_compra`, `total`, `interes`, `fecha`, `estado`) VALUES
(1, 2, '3.60', '0.60', '2019-08-18', 'a'),
(2, 2, '3.60', '0.60', '2019-08-19', 'a'),
(3, 4, '121.20', '20.20', '2019-08-23', 'a'),
(4, 4, '121.20', '20.20', '2019-08-24', 'a');

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

--
-- Volcado de datos para la tabla `tm_compra_detalle`
--

INSERT INTO `tm_compra_detalle` (`id_compra`, `id_tp`, `id_pres`, `cant`, `precio`) VALUES
(1, 1, 2, '2.00', '10.00'),
(2, 1, 11, '3.00', '2.00'),
(3, 1, 18, '1.00', '1.00'),
(4, 1, 10, '1.00', '2.00'),
(4, 1, 18, '100.00', '2.00'),
(5, 1, 18, '1.00', '1.00');

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

--
-- Volcado de datos para la tabla `tm_credito_detalle`
--

INSERT INTO `tm_credito_detalle` (`id_credito`, `id_usu`, `importe`, `fecha`) VALUES
(1, 1, '3.60', '2019-08-17 17:04:04'),
(3, 1, '121.20', '2019-08-22 17:05:32'),
(4, 1, '121.20', '2019-08-22 17:05:43'),
(2, 1, '3.60', '2019-08-22 17:05:55');

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

--
-- Volcado de datos para la tabla `tm_detalle_pedido`
--

INSERT INTO `tm_detalle_pedido` (`id_pedido`, `id_pres`, `cantidad`, `cant`, `precio`, `comentario`, `fecha_pedido`, `fecha_envio`, `estado`) VALUES
(1, 27, 0, 1, '51.90', '', '2019-07-31 15:44:44', '0000-00-00 00:00:00', 'a'),
(2, 33, 0, 1, '12.00', '', '2019-08-01 15:01:47', '0000-00-00 00:00:00', 'a'),
(3, 27, 1, 1, '51.90', '', '2019-08-01 15:03:23', '0000-00-00 00:00:00', 'i'),
(3, 27, 0, 1, '51.90', '', '2019-08-01 15:03:51', '0000-00-00 00:00:00', 'a'),
(3, 23, 1, 1, '15.00', '', '2019-08-01 15:03:51', '0000-00-00 00:00:00', 'i'),
(3, 24, 0, 1, '18.00', '', '2019-08-01 15:03:51', '0000-00-00 00:00:00', 'a'),
(3, 25, 0, 1, '18.00', '', '2019-08-01 15:03:51', '0000-00-00 00:00:00', 'a'),
(4, 1, 0, 1, '13.00', '', '2019-08-02 22:17:21', '0000-00-00 00:00:00', 'a'),
(4, 32, 0, 1, '12.00', '', '2019-08-02 22:17:21', '0000-00-00 00:00:00', 'a'),
(5, 22, 1, 1, '18.00', '', '2019-08-02 22:17:46', '0000-00-00 00:00:00', 'i'),
(5, 47, 1, 1, '5.00', '', '2019-08-02 22:17:46', '0000-00-00 00:00:00', 'i'),
(5, 49, 1, 1, '8.00', '', '2019-08-02 22:17:46', '0000-00-00 00:00:00', 'i'),
(7, 32, 0, 1, '12.00', '', '2019-08-07 15:41:09', '0000-00-00 00:00:00', 'a'),
(7, 24, 0, 1, '18.00', '', '2019-08-07 15:41:09', '0000-00-00 00:00:00', 'a'),
(8, 27, 0, 1, '51.90', '', '2019-08-07 15:57:25', '0000-00-00 00:00:00', 'a'),
(9, 27, 0, 1, '51.90', '', '2019-08-14 18:54:48', '0000-00-00 00:00:00', 'a'),
(9, 26, 0, 1, '39.00', '', '2019-08-14 18:54:48', '0000-00-00 00:00:00', 'a'),
(9, 17, 0, 1, '10.00', '', '2019-08-14 18:54:48', '0000-00-00 00:00:00', 'a'),
(10, 26, 0, 1, '39.00', '', '2019-08-17 15:30:19', '0000-00-00 00:00:00', 'a'),
(10, 1, 0, 1, '13.00', '', '2019-08-17 15:30:19', '0000-00-00 00:00:00', 'a'),
(10, 51, 0, 1, '10.00', '', '2019-08-17 15:30:19', '0000-00-00 00:00:00', 'a'),
(10, 42, 0, 1, '5.00', '', '2019-08-17 15:30:19', '0000-00-00 00:00:00', 'a'),
(11, 19, 0, 1, '10.00', '', '2019-08-17 16:43:34', '2019-08-22 18:47:11', 'p'),
(11, 46, 0, 1, '5.00', '', '2019-08-17 16:43:34', '2019-08-22 18:47:09', 'p'),
(12, 4, 0, 1, '48.00', '', '2019-08-17 16:47:47', '2019-08-22 18:47:19', 'p'),
(13, 24, 0, 1, '18.00', '', '2019-08-19 20:13:57', '0000-00-00 00:00:00', 'a'),
(14, 10, 0, 1, '8.00', '', '2019-08-22 16:48:45', '0000-00-00 00:00:00', 'a'),
(14, 3, 0, 1, '24.00', '', '2019-08-22 16:48:45', '0000-00-00 00:00:00', 'a'),
(14, 30, 1, 1, '8.00', '', '2019-08-22 16:48:45', '0000-00-00 00:00:00', 'i'),
(15, 19, 0, 3, '10.00', '', '2019-08-22 16:51:12', '0000-00-00 00:00:00', 'a'),
(15, 22, 0, 1, '18.00', 'Termino medio', '2019-08-22 16:51:12', '0000-00-00 00:00:00', 'a'),
(16, 27, 0, 1, '51.90', '', '2019-08-22 16:55:11', '2019-08-22 18:47:14', 'p'),
(16, 26, 0, 1, '39.00', '', '2019-08-22 16:55:11', '2019-08-22 18:47:13', 'p'),
(17, 25, 0, 1, '18.00', '', '2019-08-22 16:56:44', '2019-08-22 18:47:20', 'p'),
(17, 23, 0, 1, '15.00', '', '2019-08-22 16:56:44', '2019-08-22 18:47:21', 'p'),
(18, 4, 0, 1, '48.00', '', '2019-08-22 18:03:55', '0000-00-00 00:00:00', 'a'),
(18, 57, 0, 1, '15.00', '', '2019-08-22 18:03:55', '0000-00-00 00:00:00', 'a'),
(19, 26, 0, 1, '39.00', '', '2019-08-22 18:39:38', '0000-00-00 00:00:00', 'a'),
(19, 17, 0, 3, '10.00', '', '2019-08-22 18:39:38', '0000-00-00 00:00:00', 'a'),
(20, 17, 0, 1, '10.00', '', '2019-08-22 18:43:09', '2019-08-22 18:47:00', 'p'),
(20, 19, 0, 1, '10.00', '', '2019-08-22 18:43:09', '2019-08-22 18:46:56', 'x'),
(20, 26, 0, 1, '39.00', '', '2019-08-22 18:43:33', '2019-08-22 18:47:25', 'p'),
(21, 26, 0, 1, '39.00', '', '2019-08-22 18:43:48', '2019-08-22 18:47:26', 'p'),
(22, 15, 0, 1, '10.00', '', '2019-08-29 11:57:05', '0000-00-00 00:00:00', 'a'),
(22, 16, 0, 1, '15.00', '', '2019-08-29 11:57:05', '0000-00-00 00:00:00', 'a'),
(22, 62, 0, 2, '0.10', '', '2019-08-29 11:57:32', '0000-00-00 00:00:00', 'a'),
(23, 27, 0, 1, '51.90', '', '2019-08-29 13:17:38', '0000-00-00 00:00:00', 'a'),
(23, 62, 0, 1, '0.10', '', '2019-08-29 13:17:38', '0000-00-00 00:00:00', 'a'),
(24, 26, 0, 1, '39.00', '', '2019-08-29 13:25:46', '0000-00-00 00:00:00', 'a'),
(24, 62, 0, 1, '0.10', '', '2019-08-29 13:25:46', '0000-00-00 00:00:00', 'a'),
(25, 6, 0, 1, '8.00', '', '2019-09-03 18:39:44', '0000-00-00 00:00:00', 'a'),
(25, 62, 0, 1, '0.10', '', '2019-09-03 18:39:44', '0000-00-00 00:00:00', 'a'),
(26, 27, 0, 1, '51.90', '', '2019-09-11 17:03:55', '0000-00-00 00:00:00', 'a'),
(27, 17, 0, 1, '10.00', '', '2019-09-11 17:15:10', '0000-00-00 00:00:00', 'a'),
(28, 26, 0, 1, '39.00', '', '2019-09-28 10:58:42', '0000-00-00 00:00:00', 'a'),
(28, 62, 0, 1, '0.10', '', '2019-09-28 10:58:42', '0000-00-00 00:00:00', 'a'),
(29, 26, 0, 1, '39.00', '', '2019-09-29 09:20:44', '0000-00-00 00:00:00', 'a'),
(29, 18, 0, 1, '15.00', '', '2019-09-29 09:20:44', '0000-00-00 00:00:00', 'a'),
(29, 62, 0, 1, '0.10', '', '2019-09-29 09:22:03', '0000-00-00 00:00:00', 'a'),
(30, 19, 1, 1, '10.00', '', '2019-10-01 10:51:17', '0000-00-00 00:00:00', 'a'),
(31, 17, 1, 1, '10.00', '', '2019-10-01 12:47:15', '0000-00-00 00:00:00', 'a');

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

--
-- Volcado de datos para la tabla `tm_detalle_venta`
--

INSERT INTO `tm_detalle_venta` (`id_venta`, `id_prod`, `cantidad`, `precio`) VALUES
(1, 27, 1, '51.90'),
(2, 33, 1, '12.00'),
(3, 24, 1, '18.00'),
(3, 25, 1, '18.00'),
(3, 27, 1, '51.90'),
(4, 1, 1, '13.00'),
(4, 32, 1, '12.00'),
(5, 24, 1, '18.00'),
(5, 32, 1, '12.00'),
(6, 27, 1, '51.90'),
(7, 17, 1, '10.00'),
(7, 26, 1, '39.00'),
(7, 27, 1, '51.90'),
(8, 1, 1, '13.00'),
(8, 26, 1, '39.00'),
(8, 42, 1, '5.00'),
(8, 51, 1, '10.00'),
(9, 19, 1, '10.00'),
(9, 46, 1, '5.00'),
(10, 4, 1, '48.00'),
(11, 24, 1, '18.00'),
(12, 3, 1, '24.00'),
(12, 10, 1, '8.00'),
(13, 19, 3, '10.00'),
(13, 22, 1, '18.00'),
(14, 26, 1, '39.00'),
(14, 27, 1, '51.90'),
(15, 23, 1, '15.00'),
(15, 25, 1, '18.00'),
(16, 4, 1, '48.00'),
(16, 57, 1, '15.00'),
(17, 17, 3, '10.00'),
(17, 26, 1, '39.00'),
(18, 26, 1, '39.00'),
(19, 15, 1, '10.00'),
(19, 16, 1, '15.00'),
(19, 62, 2, '0.10'),
(20, 27, 1, '51.90'),
(20, 62, 1, '0.10'),
(21, 26, 1, '39.00'),
(21, 62, 1, '0.10'),
(22, 6, 1, '8.00'),
(22, 62, 1, '0.10'),
(23, 27, 1, '51.90'),
(24, 17, 1, '10.00'),
(25, 26, 1, '39.00'),
(25, 62, 1, '0.10'),
(26, 18, 1, '15.00'),
(26, 26, 1, '39.00'),
(26, 62, 1, '0.10'),
(27, 17, 1, '10.00'),
(27, 19, 1, '10.00'),
(27, 26, 1, '39.00');

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
  `imp_icbper` decimal(10,2) NOT NULL,
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
(1, 'RUC', 11, 'DNI', 8, 'IGV', '0.00', '0.10', 'soles', 'S/', '20603348169', 'MIKYTOS BRASA E.I.R.L', 'AV. JOSE FAUSTINO SANCHEZ CARRION MZA. A LOTE. 7 CALLERIA', 'logo_mikytos.jpeg', 3, '123654', 'MODDATOS', 'moddatos');

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

--
-- Volcado de datos para la tabla `tm_gastos_adm`
--

INSERT INTO `tm_gastos_adm` (`id_ga`, `id_tipo_gasto`, `id_tipo_doc`, `id_per`, `id_usu`, `id_apc`, `serie_doc`, `num_doc`, `fecha_comp`, `importe`, `motivo`, `fecha_registro`, `estado`) VALUES
(3, 1, 1, 0, 1, 1, '001', '12', '2019-08-17', '50.00', 'Egreso por compra de balon de gas', '2019-08-17 16:54:02', 'a'),
(4, 4, 1, 0, 1, 1, '001', '1222', '2019-08-17', '3.60', 'ACOSTA RIVERA HETER JHONNY', '2019-08-17 17:04:04', 'a'),
(5, 3, 1, 3, 1, 2, '', '', '1970-01-01', '930.00', 'Se paga sueldo a personal', '2019-08-22 17:00:45', 'a'),
(6, 2, 4, 0, 1, 2, '', '', '1970-01-01', '54.00', 'Se ha comprado gas', '2019-08-22 17:01:03', 'i'),
(7, 4, 2, 0, 1, 2, '001', '1212', '2019-08-22', '121.20', 'ALVARADO LAMA FELIX', '2019-08-22 17:05:32', 'a'),
(8, 4, 2, 0, 1, 2, '001', '1212', '2019-08-22', '121.20', 'ALVARADO LAMA FELIX', '2019-08-22 17:05:43', 'a'),
(9, 4, 1, 0, 1, 2, '001', '1222', '2019-08-17', '3.60', 'ACOSTA RIVERA HETER JHONNY', '2019-08-22 17:05:55', 'a');

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

--
-- Volcado de datos para la tabla `tm_ingresos_adm`
--

INSERT INTO `tm_ingresos_adm` (`id_ing`, `id_usu`, `id_apc`, `importe`, `motivo`, `fecha_reg`, `estado`) VALUES
(1, 1, 1, '100.00', 'Dinero ingresado a caja por el gerente', '2019-08-17 16:51:38', 'a'),
(2, 1, 2, '200.00', 'Se ingreso a caja dinero por parte del jefe', '2019-08-22 16:59:49', 'a'),
(3, 1, 9, '100.00', 'aaa', '2019-09-26 13:21:05', 'a'),
(4, 1, 9, '1000.00', 'Viene de boticas antuanet', '2019-09-26 13:25:46', 'a');

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

--
-- Volcado de datos para la tabla `tm_insumo`
--

INSERT INTO `tm_insumo` (`id_ins`, `id_catg`, `id_med`, `cod_ins`, `nomb_ins`, `stock_min`, `cos_uni`, `estado`) VALUES
(1, 1, 1, 'AB01', 'Bidon de Aceite Palmerola', 1, '79.00', 'a'),
(2, 1, 1, 'AB02', 'Aceite Cocinero', 1, '31.00', 'a'),
(3, 1, 2, 'AB03', 'Azucar', 1, '2.00', 'a'),
(4, 1, 2, 'AB04', 'Arroz', 1, '3.00', 'a'),
(5, 1, 1, 'AB05', 'Mostaza', 1, '14.50', 'a'),
(6, 1, 1, 'AB06', 'Ketchup', 1, '15.00', 'a'),
(7, 1, 1, 'AB07', 'Sal', 1, '0.40', 'a'),
(8, 1, 1, 'AB08', 'Vinagre Blanco Valleverde', 1, '2.50', 'a'),
(9, 1, 1, 'AB09', 'Sillao', 1, '4.50', 'a'),
(10, 1, 1, 'AB10', 'Huevo', 1, '0.30', 'a'),
(11, 1, 1, 'AB11', 'Ajinomoto', 1, '0.40', 'a'),
(12, 1, 2, 'AB12', 'Ajos', 1, '9.00', 'a'),
(13, 1, 1, 'AB13', 'Ct1', 1, '0.50', 'a'),
(14, 1, 1, 'AB14', 'Ct3', 1, '0.30', 'a'),
(15, 1, 1, 'AB15', 'Ct4', 1, '0.20', 'a'),
(16, 1, 1, 'AB16', 'Ct5', 1, '0.20', 'a'),
(17, 1, 1, 'AB17', '6 Onzas', 1, '0.20', 'a'),
(18, 1, 1, 'AB18', '1/2 Litro', 1, '0.25', 'a'),
(19, 1, 1, 'AB19', 'Servilleta Simple', 1, '13.00', 'a'),
(20, 1, 9, 'AB20', 'Liga', 1, '3.00', 'a'),
(21, 1, 1, 'AB21', 'Servilleta con Diseño', 1, '16.00', 'a'),
(22, 1, 1, 'AB22', 'Fosforo', 1, '0.30', 'a'),
(23, 1, 1, 'AB23', 'Jabon', 1, '2.00', 'a'),
(24, 1, 1, 'AB24', 'Detergente', 1, '10.00', 'a'),
(25, 1, 1, 'AB25', 'Ayudin', 1, '5.00', 'a'),
(26, 1, 1, 'AB26', 'Colgate', 1, '7.50', 'a');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tm_insumo_catg`
--

CREATE TABLE `tm_insumo_catg` (
  `id_catg` int(11) NOT NULL,
  `descripcion` varchar(45) NOT NULL,
  `estado` varchar(5) DEFAULT 'a'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Volcado de datos para la tabla `tm_insumo_catg`
--

INSERT INTO `tm_insumo_catg` (`id_catg`, `descripcion`, `estado`) VALUES
(1, 'ABARROTES', 'a');

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

--
-- Volcado de datos para la tabla `tm_inventario`
--

INSERT INTO `tm_inventario` (`id_inv`, `id_tipo_ope`, `id_ope`, `id_tipo_ins`, `id_ins`, `cos_uni`, `cant`, `fecha_r`, `estado`) VALUES
(70, 2, 1, 1, 159, '0.00', 1, '2019-03-09 10:52:56', 'a'),
(72, 1, 2, 1, 11, '2.00', 3, '2019-08-17 17:02:53', 'a'),
(73, 3, 1, 1, 1, '2.00', 2, '2019-08-17 17:06:29', 'a'),
(74, 4, 2, 1, 1, '1.00', 1, '2019-08-17 17:07:13', 'a'),
(75, 2, 14, 1, 18, '0.25', 1, '2019-08-22 16:55:48', 'a'),
(76, 1, 3, 1, 18, '1.00', 1, '2019-08-22 17:03:36', 'a'),
(77, 1, 4, 1, 10, '2.00', 1, '2019-08-22 17:04:53', 'a'),
(78, 1, 4, 1, 18, '2.00', 100, '2019-08-22 17:04:53', 'a'),
(79, 3, 3, 1, 10, '3.00', 100, '2019-08-22 17:07:24', 'a'),
(80, 4, 4, 1, 10, '3.00', 2, '2019-08-22 17:07:40', 'a'),
(81, 2, 17, 1, 18, '0.25', 1, '2019-08-22 18:40:07', 'a'),
(82, 2, 18, 1, 18, '0.25', 1, '2019-08-25 12:57:14', 'a'),
(83, 2, 21, 1, 18, '0.25', 1, '2019-08-29 13:25:53', 'a'),
(84, 1, 5, 1, 18, '1.00', 1, '2019-09-10 09:24:37', 'a'),
(85, 2, 25, 1, 18, '0.25', 1, '2019-09-28 10:58:51', 'a'),
(86, 2, 26, 1, 18, '0.25', 1, '2019-09-29 09:22:54', 'a'),
(87, 2, 27, 1, 18, '0.25', 1, '2019-10-01 10:48:37', 'a');

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

--
-- Volcado de datos para la tabla `tm_inventario_entsal`
--

INSERT INTO `tm_inventario_entsal` (`id_es`, `id_usu`, `id_tipo`, `motivo`, `fecha`, `estado`) VALUES
(1, 1, 3, 'entrada de producto', '2019-08-17 17:06:29', 'a'),
(2, 1, 4, 'salida de producto', '2019-08-17 17:07:13', 'a'),
(3, 1, 3, 'Ingreso de huevo', '2019-08-22 17:07:24', 'a'),
(4, 1, 4, 'Salida de huevo', '2019-08-22 17:07:40', 'a');

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
(3, 3, 'Miercoles', '750.00'),
(4, 4, 'Jueves', '850.00'),
(5, 5, 'Viernes', '1200.00'),
(6, 6, 'Sabado', '1800.00'),
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

--
-- Volcado de datos para la tabla `tm_mesa`
--

INSERT INTO `tm_mesa` (`id_mesa`, `id_catg`, `nro_mesa`, `estado`) VALUES
(4, 2, 'M01', 'a'),
(5, 2, 'M02', 'a'),
(6, 2, 'M03', 'a'),
(7, 2, 'M04', 'a'),
(8, 2, 'M05', 'p'),
(9, 2, 'M06', 'p'),
(10, 2, 'M07', 'a'),
(11, 2, 'M08', 'a'),
(12, 2, 'M09', 'a'),
(13, 2, 'M10', 'a'),
(18, 4, 'M01', 'a'),
(19, 4, 'M02', 'a'),
(20, 4, 'M03', 'a'),
(21, 4, 'M04', 'a'),
(22, 4, 'M05', 'a'),
(23, 4, 'M06', 'a'),
(24, 4, 'M07', 'a'),
(25, 4, 'M08', 'a'),
(26, 4, 'M09', 'a'),
(27, 4, 'M10', 'a'),
(28, 2, 'M11', 'a'),
(30, 2, 'M12', 'a'),
(31, 2, 'M13', 'a'),
(32, 2, 'M14', 'a'),
(33, 2, 'M15', 'a'),
(34, 2, 'M16', 'a'),
(35, 2, 'M17', 'a');

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

--
-- Volcado de datos para la tabla `tm_pedido`
--

INSERT INTO `tm_pedido` (`id_pedido`, `id_tipo_pedido`, `id_usu`, `fecha_pedido`, `estado`) VALUES
(1, 1, 1, '2019-07-31 15:44:38', 'c'),
(2, 1, 1, '2019-08-01 12:55:07', 'c'),
(3, 1, 1, '2019-08-01 15:03:12', 'c'),
(4, 1, 1, '2019-08-02 22:17:03', 'c'),
(5, 1, 1, '2019-08-02 22:17:32', 'i'),
(6, 2, 1, '2019-08-02 22:20:05', 'i'),
(7, 1, 1, '2019-08-07 15:41:00', 'c'),
(8, 1, 1, '2019-08-07 15:57:20', 'c'),
(9, 1, 1, '2019-08-14 18:54:39', 'c'),
(10, 1, 1, '2019-08-17 15:29:24', 'c'),
(11, 2, 1, '2019-08-17 16:43:02', 'x'),
(12, 3, 1, '2019-08-17 16:46:31', 'x'),
(13, 1, 1, '2019-08-19 20:13:45', 'c'),
(14, 1, 1, '2019-08-22 16:48:28', 'c'),
(15, 1, 1, '2019-08-22 16:50:42', 'c'),
(16, 2, 1, '2019-08-22 16:55:02', 'x'),
(17, 3, 1, '2019-08-22 16:56:33', 'x'),
(18, 1, 1, '2019-08-22 18:03:44', 'c'),
(19, 1, 3, '2019-08-22 18:39:28', 'c'),
(20, 1, 5, '2019-08-22 18:43:03', 'c'),
(21, 1, 5, '2019-08-22 18:43:42', 'c'),
(22, 1, 1, '2019-08-29 11:56:53', 'c'),
(23, 1, 1, '2019-08-29 13:17:33', 'c'),
(24, 1, 1, '2019-08-29 13:25:36', 'c'),
(25, 1, 1, '2019-09-03 18:39:00', 'c'),
(26, 1, 1, '2019-09-11 17:03:51', 'c'),
(27, 1, 1, '2019-09-11 17:15:03', 'c'),
(28, 1, 1, '2019-09-28 10:58:31', 'c'),
(29, 1, 1, '2019-09-29 09:20:26', 'c'),
(30, 1, 1, '2019-10-01 10:51:07', 'a'),
(31, 1, 5, '2019-10-01 12:47:11', 'a');

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
  `comentario` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Volcado de datos para la tabla `tm_pedido_delivery`
--

INSERT INTO `tm_pedido_delivery` (`id_pedido`, `nro_pedido`, `nomb_cliente`, `direccion`, `telefono`, `comentario`) VALUES
(12, '00001', 'Jose', '5663447', '5663447', ' '),
(17, '00002', 'Alvaro', '988787766', '988787766', ' ');

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

--
-- Volcado de datos para la tabla `tm_pedido_llevar`
--

INSERT INTO `tm_pedido_llevar` (`id_pedido`, `nro_pedido`, `nomb_cliente`, `comentario`) VALUES
(6, '00001', 'a', ' '),
(11, '00002', 'Juan', ' '),
(16, '00003', 'karla', ' ');

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

--
-- Volcado de datos para la tabla `tm_pedido_mesa`
--

INSERT INTO `tm_pedido_mesa` (`id_pedido`, `id_mesa`, `id_mozo`, `nomb_cliente`, `nro_personas`, `comentario`) VALUES
(1, 6, 5, 'Gerson Omar Pereira Torres', 0, ' '),
(2, 5, 5, 'Gerson Omar Pereira Torres', 0, ' '),
(3, 4, 5, 'k', 0, ' '),
(4, 4, 5, 'a', 0, ' '),
(5, 13, 5, 'a', 0, ' '),
(7, 5, 5, 'a', 0, ' '),
(8, 5, 5, 'a', 0, ' '),
(9, 7, 5, 'sd', 0, ' '),
(10, 5, 5, 'Pedro', 0, ' '),
(13, 6, 5, 'd', 0, ' '),
(14, 5, 5, 'Pedro', 0, ' '),
(15, 8, 5, 'Jose', 0, ' '),
(18, 7, 5, 'pedro', 0, ' '),
(19, 5, 5, 'Jose Maria', 0, ' '),
(20, 7, 5, 'Mesa M04', 0, ''),
(21, 9, 5, 'Mesa M06', 0, ''),
(22, 8, 5, 'S', 0, ' '),
(23, 6, 5, 'k', 0, ' '),
(24, 6, 5, 'h', 0, ' '),
(25, 4, 5, 'motelo', 0, ' '),
(26, 8, 5, 'aa', 0, ' '),
(27, 8, 5, 'k', 0, ' '),
(28, 8, 5, 'Gerson Omar Pereira Torres', 0, ' '),
(29, 8, 5, 'Martin', 0, ' '),
(30, 9, 5, '1', 0, ' '),
(31, 8, 5, 'Mesa M05', 0, '');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tm_producto`
--

CREATE TABLE `tm_producto` (
  `id_prod` int(11) NOT NULL,
  `id_tipo` int(11) NOT NULL,
  `id_catg` int(11) NOT NULL DEFAULT '0',
  `id_areap` int(11) NOT NULL,
  `nombre` varchar(45) DEFAULT NULL,
  `descripcion` varchar(200) DEFAULT NULL,
  `estado` varchar(45) DEFAULT 'a'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Volcado de datos para la tabla `tm_producto`
--

INSERT INTO `tm_producto` (`id_prod`, `id_tipo`, `id_catg`, `id_areap`, `nombre`, `descripcion`, `estado`) VALUES
(1, 1, 1, 1, '1/4 Pollo con Papas', '', 'a'),
(2, 1, 1, 1, '1/8 Pollo con Papas', '', 'a'),
(3, 1, 1, 1, '1/2 Pollo con Papas', '', 'a'),
(4, 1, 1, 1, '1 Pollo con Papas', '', 'a'),
(5, 1, 1, 1, '1/4 Pollo con Platano', '', 'a'),
(6, 1, 1, 1, '1/8 Pollo con Platano', '', 'a'),
(7, 1, 1, 1, '1/2 Pollo con Platano', '', 'a'),
(8, 1, 1, 1, '1 Pollo con Platano', '', 'a'),
(9, 1, 1, 1, '1/4 Pollo con Papa y Platano ', '', 'a'),
(10, 1, 1, 1, '1/8 Pollo con Papa y Platano', '', 'a'),
(11, 1, 1, 1, '1/2 Pollo con Papa y Platano', '', 'a'),
(12, 1, 1, 1, '1 Pollo con Papa y Platano', '', 'a'),
(13, 1, 1, 1, '1/4 Pollo con Chaufa y Papa', '', 'a'),
(14, 1, 1, 1, '1/8 Pollo con Chaufa y Papa', '', 'a'),
(15, 1, 1, 1, '1/8 Pollo con Tacacho', '', 'a'),
(16, 1, 1, 1, '1/4 Pollo con Tacacho', '', 'a'),
(17, 1, 1, 1, '1/8 Pollo con Patacon', '', 'a'),
(18, 1, 1, 1, '1/4 Pollo con Patacon', '', 'a'),
(19, 1, 30, 1, 'Broster Pierna/Entrepierna', '', 'a'),
(20, 1, 30, 1, 'Broster Pecho/Ala', '', 'a'),
(21, 1, 32, 1, 'Arroz Chaufa de Pollo', '', 'a'),
(22, 1, 31, 1, 'Chuleta a la Parrilla', '', 'a'),
(23, 1, 31, 1, 'Pechuga a la Plancha', '', 'a'),
(24, 1, 31, 1, 'Cecina con Tacacho', '', 'a'),
(25, 1, 31, 1, 'Cecina con Patacon', '', 'a'),
(26, 1, 1, 1, 'Pollo Oferta', '', 'a'),
(27, 1, 1, 1, 'Combo Mikytos', '', 'a'),
(28, 1, 33, 2, '1 Vaso de Chicha', '', 'a'),
(29, 1, 33, 2, '1 Vaso de Maracuya', '', 'a'),
(30, 1, 33, 2, '1 LT Jarra de Chicha', '', 'a'),
(31, 1, 33, 2, '1 LT Jarra de Maracuya', '', 'a'),
(32, 1, 33, 2, '1 1/2 LT Jarra de Chicha', '', 'a'),
(33, 1, 33, 2, '1 1/2 LT Jarra de Maracuya', '', 'a'),
(34, 1, 33, 2, '1/2 LT Jarra de chicha', '', 'a'),
(35, 1, 33, 2, '1/2 LT Jarra de Maracuya', '', 'a'),
(36, 1, 33, 2, 'Inca Kola Personal 296ml', '', 'a'),
(37, 1, 33, 2, 'Coca Cola Personal 296ml', '', 'a'),
(38, 1, 33, 2, 'Inca Kola Personal 500ml', '', 'a'),
(39, 1, 33, 2, 'Coca Cola Personal 500ml', '', 'a'),
(40, 1, 33, 2, 'Sprite Personal 400ml', '', 'a'),
(41, 1, 33, 2, 'Agua San Luis Personal 625ml', '', 'a'),
(42, 1, 33, 2, 'Inca Kola Gordita 625ml', '', 'a'),
(43, 1, 32, 1, '1 Porcion Platano', '', 'a'),
(44, 1, 32, 1, '1 Porcion Tacacho', '', 'a'),
(45, 1, 32, 1, '1 Porcion Maduro', '', 'a'),
(46, 1, 32, 1, '1 Porcion Patacon', '', 'a'),
(47, 1, 32, 1, '1 Porcion Ensalada', '', 'a'),
(48, 1, 32, 1, '1 Porcion Chaufa', '', 'a'),
(49, 1, 33, 2, 'Inca Kola 1 Litro', '', 'a'),
(50, 1, 33, 2, 'Coca Cola 1 Litro', '', 'a'),
(51, 1, 33, 2, 'Inca Kola Vidrio 1,5 Litros', '', 'a'),
(52, 1, 33, 2, 'Coca Cola Vidrio 1,5 Litros', '', 'a'),
(53, 1, 33, 2, 'Inca Kola Descartable 1,5 Litros', '', 'a'),
(54, 1, 33, 2, 'Coca Cola Descartable 1,5 Litros', '', 'a'),
(55, 1, 33, 2, 'Inca Kola 2,25 Litros', '', 'a'),
(56, 1, 33, 2, 'Coca Cola 2,25 Litros', '', 'a'),
(57, 1, 33, 2, 'Inca Kola 3 Litros', '', 'a'),
(58, 1, 33, 2, 'Coca Cola 3 Litros', '', 'a'),
(59, 1, 33, 2, 'Vino Santiago Queirolo', '', 'a'),
(60, 1, 33, 2, 'Cerveza San Juan', '', 'a'),
(61, 1, 33, 2, 'Cerveza Brahma', '', 'a'),
(62, 1, 34, 1, 'BOLSA', '', 'a');

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
(1, 'POLLOS A LA BRASA'),
(30, 'BROSTER'),
(31, 'PARRILLA'),
(32, 'GUARNICION'),
(33, 'BEBIDAS'),
(34, 'BOLSAS');

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

--
-- Volcado de datos para la tabla `tm_producto_ingr`
--

INSERT INTO `tm_producto_ingr` (`id_pi`, `id_pres`, `id_tipo_ins`, `id_ins`, `id_med`, `cant`) VALUES
(1, 26, 1, 18, 1, 1.000000);

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
(1, 1, 'PB01', 'Pollo a la brasa', '13.00', 0, 0, '190731113903.png', 'a'),
(2, 2, 'BP02', 'Pollo a la Brasa', '8.00', 0, 0, '190731114058.jpg', 'a'),
(3, 3, 'PB03', 'Pollo a la Brasa', '24.00', 0, 0, '190731114223.png', 'a'),
(4, 4, 'PB04', 'Pollo a la Brasa', '48.00', 0, 0, '190731114509.png', 'a'),
(5, 5, 'PB05', 'Pollo a la Brasa', '13.00', 0, 0, '190731114710.jpg', 'a'),
(6, 6, 'PB06', 'Pollo a la Brasa', '8.00', 0, 0, '190801035536.jpg', 'a'),
(7, 7, 'PB07', 'Pollo a la Brasa', '24.00', 0, 0, '190801035652.jpg', 'a'),
(8, 8, 'PB08', 'Pollo a la Brasa', '48.00', 0, 0, '190801035753.jpg', 'a'),
(9, 9, 'PB09', 'Pollo a la brasa', '13.00', 0, 0, '190801041217.jpg', 'a'),
(10, 10, 'PB10', 'Pollo a la Brasa', '8.00', 0, 0, '190801041412.jpg', 'a'),
(11, 11, 'PB11', 'Pollo a la Brasa', '24.00', 0, 0, '190801041753.jpg', 'a'),
(12, 12, 'PB12', 'Pollo a la Brasa', '48.00', 0, 0, '190801042002.jpg', 'a'),
(13, 13, 'PB13', 'Pollo a la brasa', '15.00', 0, 0, '190801042148.jpg', 'a'),
(14, 14, 'PB14', 'Pollo a la Brasa', '10.00', 0, 0, '190801042325.jpg', 'a'),
(15, 15, 'PB15', 'Pollo a la Brasa', '10.00', 0, 0, '190801042719.jpg', 'a'),
(16, 16, 'PB16', 'Pollo a la Brasa', '15.00', 0, 0, '190801043325.jpg', 'a'),
(17, 17, 'PB17', 'Pollo a la Brasa', '10.00', 0, 0, '190801044057.jpg', 'a'),
(18, 18, 'PB18', 'Pollo a la Brasa', '15.00', 0, 0, '190801044109.jpg', 'a'),
(19, 19, 'BR01', 'Broster', '10.00', 0, 0, '190801044427.jpg', 'a'),
(20, 20, 'BR02', 'Broster', '12.00', 0, 0, '190801044724.jpg', 'a'),
(21, 21, 'GN01', 'Chaufa Pollo', '10.00', 0, 0, '190801050630.jpg', 'a'),
(22, 22, 'PR01', 'Parrilla', '18.00', 0, 0, '190801045119.jpg', 'a'),
(23, 23, 'PR02', 'Pechuga a la Plancha', '15.00', 0, 0, '190801045754.jpg', 'a'),
(24, 24, 'PR03', 'Cecina con Tacacho', '18.00', 0, 0, '190801045804.jpg', 'a'),
(25, 25, 'PR04', 'Cecina con Patacon', '18.00', 0, 0, '190801050052.jpg', 'a'),
(26, 26, 'PB19', 'Oferta', '39.00', 1, 0, '190801040923.jpg', 'a'),
(27, 27, 'PB20', 'Combo', '51.90', 0, 0, '190801040314.jpg', 'a'),
(28, 28, 'BB01', 'Chicha', '2.00', 0, 0, '190801051913.jpg', 'a'),
(29, 29, 'BB02', 'Maracuya', '2.00', 0, 0, '190801052001.jpg', 'a'),
(30, 30, 'BB03', 'Jarra Chicha', '8.00', 0, 0, '190801052102.jpg', 'a'),
(31, 31, 'BB04', 'Jarra de Maracuya', '8.00', 0, 0, '190801052153.jpg', 'a'),
(32, 32, 'BB05', 'Jarra de Chicha', '12.00', 0, 0, '190801052306.jpg', 'a'),
(33, 33, 'BB06', ',', '12.00', 0, 0, '190801061547.jpg', 'a'),
(34, 34, 'BB07', 'Jarra de Chicha', '4.00', 0, 0, '190801061714.jpg', 'a'),
(35, 35, 'BB08', 'Jarra de Maracuya', '4.00', 0, 0, '190801061811.jpg', 'a'),
(36, 36, 'BB09', 'Inca Kola', '3.00', 0, 0, '190801061958.jpg', 'a'),
(37, 37, 'BB10', 'Coca Cola', '3.00', 0, 0, '190801062253.jpg', 'a'),
(38, 38, 'BB11', 'Inca Kola', '3.00', 0, 0, '190801062603.jpg', 'a'),
(39, 39, 'BB12', 'Coca Cola', '3.00', 0, 0, '190801062643.jpg', 'a'),
(40, 40, 'BB13', 'Sprite', '3.00', 0, 0, '190801062732.jpg', 'a'),
(41, 41, 'BB14', 'Agua', '3.00', 0, 0, '190801062817.jpg', 'a'),
(42, 42, 'BB15', 'Inca Kola', '5.00', 0, 0, '190801063034.jpg', 'a'),
(43, 43, 'GN02', 'Platano', '5.00', 0, 0, '190801050912.png', 'a'),
(44, 44, 'GN03', 'Tacacho', '5.00', 0, 0, '190801051002.jpg', 'a'),
(45, 45, 'GN04', 'Maduro', '5.00', 0, 0, '190801051053.jpg', 'a'),
(46, 46, 'GN05', 'Patacon', '5.00', 0, 0, '190801051213.jpg', 'a'),
(47, 47, 'GN06', 'Ensalada', '5.00', 0, 0, '190801051304.jpg', 'a'),
(48, 48, 'GN07', 'Chaufa', '5.00', 0, 0, '190801051443.jpg', 'a'),
(49, 49, 'BB16', 'Inca Kola', '8.00', 0, 0, '190801063138.jpg', 'a'),
(50, 50, 'BB17', 'Coca Cola', '8.00', 0, 0, '190801063213.jpg', 'a'),
(51, 51, 'BB18', 'Inca Kola', '10.00', 0, 0, '190801063347.png', 'a'),
(52, 52, 'BB19', 'Coca Cola', '10.00', 0, 0, '190801063453.png', 'a'),
(53, 53, 'BB20', 'Inca Kola', '10.00', 0, 0, '190801063545.jpg', 'a'),
(54, 54, 'BB21', 'Coca Cola', '10.00', 0, 0, '190801063624.jpg', 'a'),
(55, 55, 'BB22', 'Inca Kola', '12.00', 0, 0, '190801063745.jpg', 'a'),
(56, 56, 'BB23', 'Coca Cola', '12.00', 0, 0, '190801063709.jpg', 'a'),
(57, 57, 'BB24', 'Inca Kola', '15.00', 0, 0, '190801063822.jpg', 'a'),
(58, 58, 'BB25', 'Coca Cola', '15.00', 0, 0, '190801063914.png', 'a'),
(59, 59, 'BB26', 'Vino', '25.00', 0, 0, '190801064034.png', 'a'),
(60, 60, 'BB27', 'San Juan', '7.00', 0, 0, '190801064215.jpg', 'a'),
(61, 61, 'BB28', 'Brahma', '7.00', 0, 0, '190801064300.jpg', 'a'),
(62, 62, 'BL01', 'BOLSA', '0.10', 0, 0, 'default.png', 'a');

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

--
-- Volcado de datos para la tabla `tm_proveedor`
--

INSERT INTO `tm_proveedor` (`id_prov`, `ruc`, `razon_social`, `direccion`, `telefono`, `email`, `contacto`, `estado`) VALUES
(1, '10473174206', 'ACOSTA RIVERA HETER JHONNY', '-', 0, '', '', 'a'),
(2, '10224454681', 'ALVARADO LAMA FELIX', '-', 0, '', '', 'a'),
(3, '10228686242', 'CASTILLO ARANDA GLIRIO', '-', 0, '', '', 'a'),
(4, '20100176450', 'SOLGAS S.A.', 'CAL.CARPACCIO NRO. 250 INT. 701 URB.  SAN BORJA  (TORRE DEL ARTE PISO 7)', 0, '', '', 'a');

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
(3, 'PRODUCCION'),
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

--
-- Volcado de datos para la tabla `tm_salon`
--

INSERT INTO `tm_salon` (`id_catg`, `descripcion`, `estado`) VALUES
(2, 'Salon 01', 'a'),
(4, 'Salon 02', 'a');

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
(1, 'Principal', 'AV. JOSE FAUSTINO SANCHEZ CARRION MZA. A LOTE. 7 CALLERIA', '061-605866-943298828', 'a');

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
(3, 'POR REMUNERACION'),
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
(8, 'ONZAS', 4),
(9, 'CAJA', 2);

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
(1, 1, 1, 0, '40518095', 'Nuñez', 'Sanchez', 'Miguel Manuel', 'manuelsanchez@gmail.com', 'mnunez', 'restpe', 'a', '161117020710-avatar5.png'),
(3, 1, 2, 0, '47473462', 'AGUIRRE', 'ZAVALETA', 'TREISY ROSA', 'treisy@hotmail.com', 'taguirre', 'taguirre', 'a', 'default-avatar.png'),
(5, 1, 4, 0, '44395265', 'MERMAO', 'HUARMIYURI', 'BEIQUI LILY', 'beiqui@hotmail.com', 'bmermao', '123456', 'a', 'default-avatar.png'),
(8, 1, 3, 1, '44089749', 'MERMAO', 'HUARMIYURI', 'ZULIANA', 'zuliana@hotmail.com', 'zmermao', 'zmermao', 'a', 'default-avatar.png');

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
  `pago_efe` decimal(10,2) DEFAULT '0.00',
  `pago_tar` decimal(10,2) DEFAULT '0.00',
  `descuento` decimal(10,2) DEFAULT '0.00',
  `bolsa` decimal(10,2) NOT NULL,
  `igv` decimal(10,2) DEFAULT '0.00',
  `total` decimal(10,2) DEFAULT '0.00',
  `fecha_venta` datetime DEFAULT NULL,
  `estado` varchar(5) DEFAULT 'a',
  `observacion` varchar(100) DEFAULT NULL,
  `aceptado` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Volcado de datos para la tabla `tm_venta`
--

INSERT INTO `tm_venta` (`id_venta`, `id_pedido`, `id_tipo_pedido`, `id_cliente`, `id_tipo_doc`, `id_tipo_pago`, `id_usu`, `id_apc`, `serie_doc`, `nro_doc`, `pago_efe`, `pago_tar`, `descuento`, `bolsa`, `igv`, `total`, `fecha_venta`, `estado`, `observacion`, `aceptado`) VALUES
(1, 1, 1, 1, 1, 1, 1, 1, '001', '0000001', '51.90', '0.00', '0.00', '0.00', '0.00', '51.90', '2019-07-31 15:44:49', 'a', NULL, ''),
(2, 2, 1, 1, 1, 1, 1, 1, '001', '0000002', '12.00', '0.00', '0.00', '0.00', '0.00', '12.00', '2019-08-01 15:01:53', 'a', NULL, 'Aceptada'),
(3, 3, 1, 1, 1, 1, 1, 1, '001', '0000003', '87.90', '0.00', '0.00', '0.00', '0.00', '87.90', '2019-08-02 12:13:07', 'a', NULL, 'Aceptada'),
(4, 4, 1, 66, 1, 1, 1, 1, '001', '0000004', '25.00', '0.00', '0.00', '0.00', '0.00', '25.00', '2019-08-02 22:19:19', 'a', NULL, 'Aceptada'),
(5, 7, 1, 1, 1, 1, 1, 1, '001', '0000005', '30.00', '0.00', '0.00', '0.00', '0.00', '30.00', '2019-08-07 15:41:17', 'a', NULL, 'Aceptada'),
(6, 8, 1, 4, 2, 1, 1, 1, '001', '0000001', '51.90', '0.00', '0.00', '0.00', '0.00', '51.90', '2019-08-07 15:57:38', 'a', NULL, 'Aceptada'),
(7, 9, 1, 1, 1, 1, 1, 1, '001', '0000006', '90.81', '0.00', '10.09', '0.00', '0.00', '100.90', '2019-08-14 18:55:41', 'a', NULL, 'Aceptada'),
(8, 10, 1, 66, 1, 1, 1, 1, '001', '0000007', '53.60', '0.00', '13.40', '0.00', '0.00', '67.00', '2019-08-17 15:36:11', 'a', NULL, 'Aceptada'),
(9, 11, 2, 4, 2, 2, 1, 1, '001', '0000002', '0.00', '15.00', '0.00', '0.00', '0.00', '15.00', '2019-08-17 16:44:21', 'a', NULL, 'Aceptada'),
(10, 12, 3, 1, 1, 3, 1, 1, '001', '0000008', '20.00', '28.00', '0.00', '0.00', '0.00', '48.00', '2019-08-17 16:48:41', 'a', NULL, 'Aceptada'),
(11, 13, 1, 1, 1, 1, 1, 2, '001', '0000009', '18.00', '0.00', '0.00', '0.00', '0.00', '18.00', '2019-08-19 20:15:01', 'a', NULL, 'Aceptada'),
(12, 14, 1, 1, 1, 1, 1, 2, '001', '0000010', '30.00', '0.00', '2.00', '0.00', '0.00', '32.00', '2019-08-22 16:52:47', 'a', NULL, 'Aceptada'),
(13, 15, 1, 4, 2, 2, 1, 2, '001', '0000003', '0.00', '48.00', '0.00', '0.00', '0.00', '48.00', '2019-08-22 16:54:23', 'a', NULL, 'Aceptada'),
(14, 16, 2, 66, 1, 3, 1, 2, '001', '0000011', '10.00', '80.90', '0.00', '0.00', '0.00', '90.90', '2019-08-22 16:55:48', 'a', NULL, 'Aceptada'),
(15, 17, 3, 1, 1, 1, 1, 2, '001', '0000012', '33.00', '0.00', '0.00', '0.00', '0.00', '33.00', '2019-08-22 16:57:17', 'a', NULL, 'Aceptada'),
(16, 18, 1, 1, 1, 1, 1, 2, '001', '0000013', '60.00', '0.00', '3.00', '0.00', '0.00', '63.00', '2019-08-22 18:04:21', 'a', NULL, 'Aceptada'),
(17, 19, 1, 1, 1, 1, 3, 3, '001', '0000014', '69.00', '0.00', '0.00', '0.00', '0.00', '69.00', '2019-08-22 18:40:07', 'a', NULL, 'Aceptada'),
(18, 21, 1, 23, 3, 1, 1, 2, '001', '0000001', '39.00', '0.00', '0.00', '0.00', '0.00', '39.00', '2019-08-25 12:57:14', 'a', NULL, ''),
(19, 22, 1, 1, 1, 1, 1, 2, '001', '0000015', '25.40', '0.00', '0.00', '0.20', '0.00', '25.20', '2019-08-29 11:57:47', 'a', NULL, 'Aceptada'),
(20, 23, 1, 1, 1, 1, 1, 2, '001', '0000016', '52.10', '0.00', '0.00', '0.10', '0.00', '52.00', '2019-08-29 13:17:44', 'a', NULL, 'Aceptada'),
(21, 24, 1, 1, 1, 1, 1, 2, '001', '0000017', '39.20', '0.00', '0.00', '0.10', '0.00', '39.10', '2019-08-29 13:25:53', 'a', NULL, 'Aceptada'),
(22, 25, 1, 69, 1, 1, 1, 2, '001', '0000018', '8.20', '0.00', '0.00', '0.10', '0.00', '8.10', '2019-09-03 18:40:57', 'a', NULL, 'Aceptada'),
(23, 26, 1, 1, 1, 1, 1, 2, '001', '0000019', '51.90', '0.00', '0.00', '0.00', '0.00', '51.90', '2019-09-11 17:04:03', 'a', NULL, 'Aceptada'),
(24, 27, 1, 66, 1, 1, 1, 9, '001', '0000020', '10.00', '0.00', '0.00', '0.00', '0.00', '10.00', '2019-09-28 10:58:00', 'a', NULL, 'Aceptada'),
(25, 28, 1, 1, 1, 1, 1, 9, '001', '0000021', '39.20', '0.00', '0.00', '0.10', '0.00', '39.10', '2019-09-28 10:58:51', 'a', NULL, 'Aceptada'),
(26, 29, 1, 66, 1, 1, 1, 9, '001', '0000022', '54.20', '0.00', '0.00', '0.10', '0.00', '54.10', '2019-09-29 09:22:54', 'a', NULL, 'Aceptada'),
(27, 20, 1, 1, 2, 1, 1, 9, '001', '0000004', '59.00', '0.00', '0.00', '0.00', '0.00', '59.00', '2019-10-01 10:48:37', 'a', NULL, '');

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `v_caja_aper`
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
--
CREATE TABLE `v_cocina_de` (
`id_pedido` int(11)
,`id_areap` int(11)
,`id_tipo` int(11)
,`id_pres` int(11)
,`cantidad` bigint(11)
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
--
CREATE TABLE `v_cocina_mo` (
`id_pedido` int(11)
,`id_areap` int(11)
,`id_tipo` int(11)
,`id_pres` int(11)
,`cantidad` bigint(11)
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
--
CREATE TABLE `v_det_delivery` (
`id_pedido` int(11)
,`id_pres` int(11)
,`cantidad` bigint(11)
,`precio` decimal(10,2)
,`estado` varchar(5)
,`nombre_prod` varchar(45)
,`pres_prod` varchar(45)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `v_det_llevar`
--
CREATE TABLE `v_det_llevar` (
`id_pedido` int(11)
,`id_pres` int(11)
,`cantidad` bigint(11)
,`precio` decimal(10,2)
,`estado` varchar(5)
,`nombre_prod` varchar(45)
,`pres_prod` varchar(45)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `v_gastosadm`
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
--
CREATE TABLE `v_insprod` (
`id_tipo_ins` bigint(20)
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
--
CREATE TABLE `v_inventario_ent` (
`id_tipo_ins` int(11)
,`id_ins` int(11)
,`total` double
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `v_inventario_sal`
--
CREATE TABLE `v_inventario_sal` (
`id_tipo_ins` int(11)
,`id_ins` int(11)
,`total` double
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `v_listar_mesas`
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
,`bolsa` decimal(10,2)
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

CREATE   VIEW `v_caja_aper`  AS  select `apc`.`id_apc` AS `id_apc`,`apc`.`id_usu` AS `id_usu`,`apc`.`id_caja` AS `id_caja`,`apc`.`id_turno` AS `id_turno`,`apc`.`fecha_aper` AS `fecha_a`,`apc`.`monto_aper` AS `monto_a`,`apc`.`fecha_cierre` AS `fecha_c`,`apc`.`monto_cierre` AS `monto_c`,`apc`.`monto_sistema` AS `monto_s`,`apc`.`estado` AS `estado`,concat(`tp`.`nombres`,' ',`tp`.`ape_paterno`,' ',`tp`.`ape_materno`) AS `desc_per`,`tc`.`descripcion` AS `desc_caja`,`tt`.`descripcion` AS `desc_turno` from (((`tm_aper_cierre` `apc` join `tm_usuario` `tp` on((`apc`.`id_usu` = `tp`.`id_usu`))) join `tm_caja` `tc` on((`apc`.`id_caja` = `tc`.`id_caja`))) join `tm_turno` `tt` on((`apc`.`id_turno` = `tt`.`id_turno`))) order by `apc`.`id_apc` desc ;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_clientes`
--
DROP TABLE IF EXISTS `v_clientes`;

CREATE   VIEW `v_clientes`  AS  select `tm_cliente`.`id_cliente` AS `id_cliente`,`tm_cliente`.`dni` AS `dni`,`tm_cliente`.`ruc` AS `ruc`,`tm_cliente`.`fecha_nac` AS `fecha_nac`,`tm_cliente`.`direccion` AS `direccion`,`tm_cliente`.`estado` AS `estado`,concat(ifnull(`tm_cliente`.`razon_social`,''),'',`tm_cliente`.`nombres`,' ',`tm_cliente`.`ape_paterno`,' ',`tm_cliente`.`ape_materno`) AS `nombre` from `tm_cliente` order by `tm_cliente`.`id_cliente` desc ;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_cocina_de`
--
DROP TABLE IF EXISTS `v_cocina_de`;

CREATE   VIEW `v_cocina_de`  AS  (select `dp`.`id_pedido` AS `id_pedido`,`vp`.`id_areap` AS `id_areap`,`vp`.`id_tipo` AS `id_tipo`,`dp`.`id_pres` AS `id_pres`,if((`dp`.`cantidad` < `dp`.`cant`),`dp`.`cant`,`dp`.`cantidad`) AS `cantidad`,`dp`.`comentario` AS `comentario`,`dp`.`fecha_pedido` AS `fecha_pedido`,`dp`.`fecha_envio` AS `fecha_envio`,`dp`.`estado` AS `estado`,`pd`.`nro_pedido` AS `nro_pedido`,`tp`.`id_usu` AS `id_usu`,`vp`.`nombre_prod` AS `nombre_prod`,`vp`.`pres_prod` AS `pres_prod`,`vu`.`ape_paterno` AS `ape_paterno`,`vu`.`ape_materno` AS `ape_materno`,`vu`.`nombres` AS `nombres` from ((((`tm_detalle_pedido` `dp` join `tm_pedido_delivery` `pd` on((`dp`.`id_pedido` = `pd`.`id_pedido`))) join `tm_pedido` `tp` on((`dp`.`id_pedido` = `tp`.`id_pedido`))) join `v_productos` `vp` on((`dp`.`id_pres` = `vp`.`id_pres`))) join `v_usuarios` `vu` on((`tp`.`id_usu` = `vu`.`id_usu`))) where ((`dp`.`estado` <> 'c') and (`dp`.`estado` <> 'i'))) ;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_cocina_me`
--
DROP TABLE IF EXISTS `v_cocina_me`;

CREATE   VIEW `v_cocina_me`  AS  select `dp`.`id_pedido` AS `id_pedido`,`vp`.`id_areap` AS `id_areap`,`vp`.`id_tipo` AS `id_tipo`,`dp`.`id_pres` AS `id_pres`,`dp`.`cantidad` AS `cantidad`,`dp`.`comentario` AS `comentario`,`dp`.`fecha_pedido` AS `fecha_pedido`,`dp`.`fecha_envio` AS `fecha_envio`,`dp`.`estado` AS `estado`,`pm`.`id_mesa` AS `id_mesa`,`pm`.`id_mozo` AS `id_mozo`,`vp`.`nombre_prod` AS `nombre_prod`,`vp`.`pres_prod` AS `pres_prod`,`vm`.`nro_mesa` AS `nro_mesa`,`vm`.`desc_m` AS `desc_m`,`vu`.`ape_paterno` AS `ape_paterno`,`vu`.`ape_materno` AS `ape_materno`,`vu`.`nombres` AS `nombres` from (((((`tm_detalle_pedido` `dp` join `tm_pedido_mesa` `pm` on((`dp`.`id_pedido` = `pm`.`id_pedido`))) join `tm_pedido` `tp` on((`dp`.`id_pedido` = `tp`.`id_pedido`))) join `v_productos` `vp` on((`dp`.`id_pres` = `vp`.`id_pres`))) join `v_mesas` `vm` on((`pm`.`id_mesa` = `vm`.`id_mesa`))) join `v_usuarios` `vu` on((`pm`.`id_mozo` = `vu`.`id_usu`))) where (`dp`.`estado` <> 'i') ;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_cocina_mo`
--
DROP TABLE IF EXISTS `v_cocina_mo`;

CREATE   VIEW `v_cocina_mo`  AS  select `dp`.`id_pedido` AS `id_pedido`,`vp`.`id_areap` AS `id_areap`,`vp`.`id_tipo` AS `id_tipo`,`dp`.`id_pres` AS `id_pres`,if((`dp`.`cantidad` < `dp`.`cant`),`dp`.`cant`,`dp`.`cantidad`) AS `cantidad`,`dp`.`comentario` AS `comentario`,`dp`.`fecha_pedido` AS `fecha_pedido`,`dp`.`fecha_envio` AS `fecha_envio`,`dp`.`estado` AS `estado`,`pm`.`nro_pedido` AS `nro_pedido`,`tp`.`id_usu` AS `id_usu`,`vp`.`nombre_prod` AS `nombre_prod`,`vp`.`pres_prod` AS `pres_prod`,`vu`.`ape_paterno` AS `ape_paterno`,`vu`.`ape_materno` AS `ape_materno`,`vu`.`nombres` AS `nombres` from ((((`tm_detalle_pedido` `dp` join `tm_pedido_llevar` `pm` on((`dp`.`id_pedido` = `pm`.`id_pedido`))) join `tm_pedido` `tp` on((`dp`.`id_pedido` = `tp`.`id_pedido`))) join `v_productos` `vp` on((`dp`.`id_pres` = `vp`.`id_pres`))) join `v_usuarios` `vu` on((`tp`.`id_usu` = `vu`.`id_usu`))) where ((`dp`.`estado` <> 'c') and (`dp`.`estado` <> 'i')) ;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_compras`
--
DROP TABLE IF EXISTS `v_compras`;

CREATE   VIEW `v_compras`  AS  select `c`.`id_compra` AS `id_compra`,`c`.`id_prov` AS `id_prov`,`c`.`id_tipo_compra` AS `id_tipo_compra`,`c`.`id_tipo_doc` AS `id_tipo_doc`,`c`.`fecha_c` AS `fecha_c`,`c`.`hora_c` AS `hora_c`,`c`.`serie_doc` AS `serie_doc`,`c`.`num_doc` AS `num_doc`,`c`.`igv` AS `igv`,`c`.`total` AS `total`,`c`.`estado` AS `estado`,`tc`.`descripcion` AS `desc_tc`,`td`.`descripcion` AS `desc_td`,`tp`.`razon_social` AS `desc_prov` from (((`tm_compra` `c` join `tm_tipo_compra` `tc` on((`c`.`id_tipo_compra` = `tc`.`id_tipo_compra`))) join `tm_tipo_doc` `td` on((`c`.`id_tipo_doc` = `td`.`id_tipo_doc`))) join `tm_proveedor` `tp` on((`c`.`id_prov` = `tp`.`id_prov`))) where (`c`.`id_compra` <> 0) order by `c`.`id_compra` desc ;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_det_delivery`
--
DROP TABLE IF EXISTS `v_det_delivery`;

CREATE   VIEW `v_det_delivery`  AS  (select `dp`.`id_pedido` AS `id_pedido`,`dp`.`id_pres` AS `id_pres`,if((`dp`.`cantidad` < `dp`.`cant`),`dp`.`cant`,`dp`.`cantidad`) AS `cantidad`,`dp`.`precio` AS `precio`,`dp`.`estado` AS `estado`,`vp`.`nombre_prod` AS `nombre_prod`,`vp`.`pres_prod` AS `pres_prod` from (((`tm_detalle_pedido` `dp` join `tm_pedido_delivery` `pd` on((`dp`.`id_pedido` = `pd`.`id_pedido`))) join `tm_pedido` `tp` on((`dp`.`id_pedido` = `tp`.`id_pedido`))) join `v_productos` `vp` on((`dp`.`id_pres` = `vp`.`id_pres`))) where (`dp`.`estado` <> 'i')) ;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_det_llevar`
--
DROP TABLE IF EXISTS `v_det_llevar`;

CREATE   VIEW `v_det_llevar`  AS  select `dp`.`id_pedido` AS `id_pedido`,`dp`.`id_pres` AS `id_pres`,if((`dp`.`cantidad` < `dp`.`cant`),`dp`.`cant`,`dp`.`cantidad`) AS `cantidad`,`dp`.`precio` AS `precio`,`dp`.`estado` AS `estado`,`vp`.`nombre_prod` AS `nombre_prod`,`vp`.`pres_prod` AS `pres_prod` from (((`tm_detalle_pedido` `dp` join `tm_pedido_llevar` `pm` on((`dp`.`id_pedido` = `pm`.`id_pedido`))) join `tm_pedido` `tp` on((`dp`.`id_pedido` = `tp`.`id_pedido`))) join `v_productos` `vp` on((`dp`.`id_pres` = `vp`.`id_pres`))) where (`dp`.`estado` <> 'i') ;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_gastosadm`
--
DROP TABLE IF EXISTS `v_gastosadm`;

CREATE   VIEW `v_gastosadm`  AS  select `ga`.`id_ga` AS `id_ga`,`ga`.`id_tipo_gasto` AS `id_tg`,`ga`.`id_tipo_doc` AS `id_td`,`ga`.`id_per` AS `id_per`,`ga`.`id_usu` AS `id_usu`,`ga`.`id_apc` AS `id_apc`,`ga`.`serie_doc` AS `serie_doc`,`ga`.`num_doc` AS `num_doc`,`ga`.`fecha_comp` AS `fecha_comp`,`ga`.`importe` AS `importe`,`ga`.`motivo` AS `motivo`,`ga`.`fecha_registro` AS `fecha_re`,`ga`.`estado` AS `estado`,`tg`.`descripcion` AS `des_tg`,`td`.`descripcion` AS `des_td`,concat(`tu`.`nombres`,' ',`tu`.`ape_paterno`,' ',`tu`.`ape_materno`) AS `desc_usu`,concat(`tus`.`nombres`,' ',`tus`.`ape_paterno`,' ',`tus`.`ape_materno`) AS `desc_per` from ((((`tm_gastos_adm` `ga` join `tm_tipo_gasto` `tg` on((`ga`.`id_tipo_gasto` = `tg`.`id_tipo_gasto`))) join `tm_tipo_doc` `td` on((`ga`.`id_tipo_doc` = `td`.`id_tipo_doc`))) join `tm_usuario` `tu` on((`ga`.`id_usu` = `tu`.`id_usu`))) left join `tm_usuario` `tus` on((`ga`.`id_per` = `tus`.`id_usu`))) where (`ga`.`id_ga` <> 0) order by `ga`.`id_ga` desc ;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_insprod`
--
DROP TABLE IF EXISTS `v_insprod`;

CREATE   VIEW `v_insprod`  AS  select 1 AS `id_tipo_ins`,`i`.`id_ins` AS `id_ins`,`i`.`cod_ins` AS `cod_ins`,`i`.`nomb_ins` AS `nomb_ins`,`m`.`descripcion` AS `nomb_med`,`i`.`cos_uni` AS `cos_uni`,`i`.`id_med` AS `id_med`,`m`.`grupo` AS `grupo_med` from (`tm_insumo` `i` join `tm_tipo_medida` `m` on((`i`.`id_med` = `m`.`id_med`))) union select 2 AS `tipo_p`,`pp`.`id_pres` AS `id_pres`,`pp`.`cod_prod` AS `cod_prod`,concat(`p`.`nombre`,' ',`pp`.`presentacion`) AS `CONCAT(p.nombre,' ',pp.presentacion)`,'UNIDAD' AS `UNIDAD`,`pp`.`precio` AS `cos_uni`,'1' AS `1`,'1' AS `1` from (`tm_producto` `p` join `tm_producto_pres` `pp` on((`p`.`id_prod` = `pp`.`id_prod`))) where (`p`.`id_tipo` = 2) ;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_insumos`
--
DROP TABLE IF EXISTS `v_insumos`;

CREATE   VIEW `v_insumos`  AS  (select `i`.`id_ins` AS `id_ins`,`i`.`id_catg` AS `id_catg`,`i`.`id_med` AS `id_med`,`i`.`cod_ins` AS `cod_ins`,`i`.`nomb_ins` AS `nomb_ins`,`i`.`stock_min` AS `stock_min`,`i`.`cos_uni` AS `cos_uni`,`i`.`estado` AS `estado`,`ic`.`descripcion` AS `desc_c`,`m`.`descripcion` AS `desc_m`,`m`.`grupo` AS `cod_g` from ((`tm_insumo` `i` join `tm_insumo_catg` `ic` on((`i`.`id_catg` = `ic`.`id_catg`))) join `tm_tipo_medida` `m` on((`i`.`id_med` = `m`.`id_med`)))) ;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_inventario`
--
DROP TABLE IF EXISTS `v_inventario`;

CREATE   VIEW `v_inventario`  AS  (select `e`.`id_tipo_ins` AS `id_tipo_ins`,`e`.`id_ins` AS `id_ins`,ifnull(`e`.`total`,0) AS `ent`,ifnull(`s`.`total`,0) AS `sal` from (`v_inventario_ent` `e` left join `v_inventario_sal` `s` on((`e`.`id_ins` = `s`.`id_ins`)))) ;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_inventario_ent`
--
DROP TABLE IF EXISTS `v_inventario_ent`;

CREATE   VIEW `v_inventario_ent`  AS  (select `tm_inventario`.`id_tipo_ins` AS `id_tipo_ins`,`tm_inventario`.`id_ins` AS `id_ins`,if(((`tm_inventario`.`id_tipo_ope` = 1) or (`tm_inventario`.`id_tipo_ope` = 3)),sum(`tm_inventario`.`cant`),0) AS `total` from `tm_inventario` where ((`tm_inventario`.`id_tipo_ope` <> 2) and (`tm_inventario`.`id_tipo_ope` <> 4)) group by `tm_inventario`.`id_tipo_ins`,`tm_inventario`.`id_ins`) ;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_inventario_sal`
--
DROP TABLE IF EXISTS `v_inventario_sal`;

CREATE   VIEW `v_inventario_sal`  AS  (select `tm_inventario`.`id_tipo_ins` AS `id_tipo_ins`,`tm_inventario`.`id_ins` AS `id_ins`,if(((`tm_inventario`.`id_tipo_ope` = 2) or (`tm_inventario`.`id_tipo_ope` = 4)),sum(`tm_inventario`.`cant`),0) AS `total` from `tm_inventario` where ((`tm_inventario`.`id_tipo_ope` <> 1) and (`tm_inventario`.`id_tipo_ope` <> 3)) group by `tm_inventario`.`id_tipo_ins`,`tm_inventario`.`id_ins`) ;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_listar_mesas`
--
DROP TABLE IF EXISTS `v_listar_mesas`;

CREATE   VIEW `v_listar_mesas`  AS  select `vm`.`id_mesa` AS `id_mesa`,`vm`.`id_catg` AS `id_catg`,`vm`.`nro_mesa` AS `nro_mesa`,`vm`.`estado` AS `estado`,`vm`.`desc_m` AS `desc_m`,`vo`.`id_pedido` AS `id_pedido`,`vo`.`fecha_p` AS `fecha_p` from (`v_mesas` `vm` left join `v_pedido_mesa` `vo` on((`vm`.`id_mesa` = `vo`.`id_mesa`))) order by `vm`.`nro_mesa` ;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_mesas`
--
DROP TABLE IF EXISTS `v_mesas`;

CREATE   VIEW `v_mesas`  AS  select `m`.`id_mesa` AS `id_mesa`,`m`.`id_catg` AS `id_catg`,`m`.`nro_mesa` AS `nro_mesa`,`m`.`estado` AS `estado`,`cm`.`descripcion` AS `desc_m` from (`tm_mesa` `m` join `tm_salon` `cm` on((`m`.`id_catg` = `cm`.`id_catg`))) where ((`m`.`id_mesa` <> 0) and (`cm`.`estado` <> 'i')) order by `m`.`id_mesa` ;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_pedido_delivery`
--
DROP TABLE IF EXISTS `v_pedido_delivery`;

CREATE   VIEW `v_pedido_delivery`  AS  (select `p`.`id_pedido` AS `id_pedido`,`p`.`id_tipo_pedido` AS `id_tipo_p`,`p`.`id_usu` AS `id_usu`,`p`.`fecha_pedido` AS `fecha_p`,`p`.`estado` AS `estado`,`pd`.`nro_pedido` AS `nro_pedido`,`pd`.`nomb_cliente` AS `nomb_c`,`pd`.`direccion` AS `direc`,`pd`.`telefono` AS `telef`,`pd`.`comentario` AS `comentario` from (`tm_pedido` `p` join `tm_pedido_delivery` `pd` on((`p`.`id_pedido` = `pd`.`id_pedido`))) where (`p`.`id_pedido` <> 0) order by `p`.`id_pedido` desc) ;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_pedido_llevar`
--
DROP TABLE IF EXISTS `v_pedido_llevar`;

CREATE   VIEW `v_pedido_llevar`  AS  select `p`.`id_pedido` AS `id_pedido`,`p`.`id_tipo_pedido` AS `id_tipo_p`,`p`.`id_usu` AS `id_usu`,`p`.`fecha_pedido` AS `fecha_p`,`p`.`estado` AS `estado`,`pl`.`nro_pedido` AS `nro_pedido`,`pl`.`nomb_cliente` AS `nomb_c`,`pl`.`comentario` AS `comentario` from (`tm_pedido` `p` join `tm_pedido_llevar` `pl` on((`p`.`id_pedido` = `pl`.`id_pedido`))) where (`p`.`id_pedido` <> 0) order by `p`.`id_pedido` desc ;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_pedido_mesa`
--
DROP TABLE IF EXISTS `v_pedido_mesa`;

CREATE   VIEW `v_pedido_mesa`  AS  select `p`.`id_pedido` AS `id_pedido`,`p`.`id_tipo_pedido` AS `id_tipo_p`,`p`.`id_usu` AS `id_usu`,`pm`.`id_mesa` AS `id_mesa`,`p`.`fecha_pedido` AS `fecha_p`,`p`.`estado` AS `estado`,`pm`.`nomb_cliente` AS `nomb_c`,`pm`.`nro_personas` AS `nro_p`,`pm`.`comentario` AS `comentario`,`vm`.`nro_mesa` AS `nro_mesa`,`vm`.`desc_m` AS `desc_m`,`vm`.`estado` AS `est_m` from ((`tm_pedido` `p` join `tm_pedido_mesa` `pm` on((`p`.`id_pedido` = `pm`.`id_pedido`))) join `v_mesas` `vm` on((`pm`.`id_mesa` = `vm`.`id_mesa`))) where ((`p`.`id_pedido` <> 0) and (`p`.`estado` = 'a')) order by `p`.`id_pedido` desc ;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_productos`
--
DROP TABLE IF EXISTS `v_productos`;

CREATE   VIEW `v_productos`  AS  select `pp`.`id_pres` AS `id_pres`,`pp`.`id_prod` AS `id_prod`,`p`.`id_tipo` AS `id_tipo`,`p`.`id_catg` AS `id_catg`,`p`.`id_areap` AS `id_areap`,`cp`.`descripcion` AS `desc_c`,`pp`.`cod_prod` AS `cod_prod`,`p`.`nombre` AS `nombre_prod`,`pp`.`presentacion` AS `pres_prod`,`pp`.`precio` AS `precio`,`pp`.`imagen` AS `imagen`,`pp`.`estado` AS `estado` from ((`tm_producto_pres` `pp` join `tm_producto` `p` on((`pp`.`id_prod` = `p`.`id_prod`))) join `tm_producto_catg` `cp` on((`p`.`id_catg` = `cp`.`id_catg`))) where ((`pp`.`id_pres` <> 0) and (`p`.`estado` = 'a')) order by `pp`.`id_pres` desc ;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_usuarios`
--
DROP TABLE IF EXISTS `v_usuarios`;

CREATE   VIEW `v_usuarios`  AS  select `u`.`id_usu` AS `id_usu`,`u`.`id_tie` AS `id_tie`,`u`.`id_rol` AS `id_rol`,`u`.`id_areap` AS `id_areap`,`u`.`dni` AS `dni`,`u`.`ape_paterno` AS `ape_paterno`,`u`.`ape_materno` AS `ape_materno`,`u`.`nombres` AS `nombres`,`u`.`email` AS `email`,`u`.`usuario` AS `usuario`,`u`.`contrasena` AS `contrasena`,`u`.`estado` AS `estado`,`u`.`imagen` AS `imagen`,`r`.`descripcion` AS `desc_r`,`t`.`nombre` AS `desc_t`,`t`.`direccion` AS `direc_t`,`t`.`telefono` AS `telf_t`,`p`.`nombre` AS `desc_ap` from (((`tm_usuario` `u` join `tm_rol` `r` on((`u`.`id_rol` = `r`.`id_rol`))) left join `tm_tienda` `t` on((`u`.`id_tie` = `t`.`id_tie`))) left join `tm_area_prod` `p` on((`u`.`id_areap` = `p`.`id_areap`))) where (`u`.`id_usu` <> 0) order by `u`.`id_usu` desc ;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_ventas_con`
--
DROP TABLE IF EXISTS `v_ventas_con`;

CREATE   VIEW `v_ventas_con`  AS  select `v`.`id_venta` AS `id_ven`,`v`.`id_pedido` AS `id_ped`,`v`.`id_tipo_pedido` AS `id_tped`,`v`.`id_cliente` AS `id_cli`,`v`.`id_tipo_doc` AS `id_tdoc`,`v`.`id_tipo_pago` AS `id_tpag`,`v`.`id_usu` AS `id_usu`,`v`.`id_apc` AS `id_apc`,`v`.`serie_doc` AS `ser_doc`,`v`.`nro_doc` AS `nro_doc`,`v`.`pago_efe` AS `pago_efe`,`v`.`pago_tar` AS `pago_tar`,`v`.`descuento` AS `descu`,`v`.`bolsa` AS `bolsa`,`v`.`igv` AS `igv`,`v`.`total` AS `total`,`v`.`fecha_venta` AS `fec_ven`,`v`.`estado` AS `estado`,`v`.`observacion` AS `obser`,`td`.`descripcion` AS `desc_td`,`tp`.`descripcion` AS `desc_tp`,concat(`tu`.`ape_paterno`,' ',`tu`.`ape_materno`,' ',`tu`.`nombres`) AS `desc_usu` from (((`tm_venta` `v` join `tm_tipo_doc` `td` on((`v`.`id_tipo_doc` = `td`.`id_tipo_doc`))) join `tm_tipo_pago` `tp` on((`v`.`id_tipo_pago` = `tp`.`id_tipo_pago`))) join `tm_usuario` `tu` on((`v`.`id_usu` = `tu`.`id_usu`))) where (`v`.`id_venta` <> 0) order by `v`.`id_venta` desc ;

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
  MODIFY `id_apc` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;
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
  MODIFY `id_cliente` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=70;
--
-- AUTO_INCREMENT de la tabla `tm_compra`
--
ALTER TABLE `tm_compra`
  MODIFY `id_compra` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;
--
-- AUTO_INCREMENT de la tabla `tm_compra_credito`
--
ALTER TABLE `tm_compra_credito`
  MODIFY `id_credito` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;
--
-- AUTO_INCREMENT de la tabla `tm_empresa`
--
ALTER TABLE `tm_empresa`
  MODIFY `id_de` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;
--
-- AUTO_INCREMENT de la tabla `tm_gastos_adm`
--
ALTER TABLE `tm_gastos_adm`
  MODIFY `id_ga` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;
--
-- AUTO_INCREMENT de la tabla `tm_impresora`
--
ALTER TABLE `tm_impresora`
  MODIFY `id_imp` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;
--
-- AUTO_INCREMENT de la tabla `tm_ingresos_adm`
--
ALTER TABLE `tm_ingresos_adm`
  MODIFY `id_ing` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;
--
-- AUTO_INCREMENT de la tabla `tm_insumo`
--
ALTER TABLE `tm_insumo`
  MODIFY `id_ins` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;
--
-- AUTO_INCREMENT de la tabla `tm_insumo_catg`
--
ALTER TABLE `tm_insumo_catg`
  MODIFY `id_catg` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;
--
-- AUTO_INCREMENT de la tabla `tm_inventario`
--
ALTER TABLE `tm_inventario`
  MODIFY `id_inv` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=88;
--
-- AUTO_INCREMENT de la tabla `tm_inventario_entsal`
--
ALTER TABLE `tm_inventario_entsal`
  MODIFY `id_es` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;
--
-- AUTO_INCREMENT de la tabla `tm_margen_venta`
--
ALTER TABLE `tm_margen_venta`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;
--
-- AUTO_INCREMENT de la tabla `tm_mesa`
--
ALTER TABLE `tm_mesa`
  MODIFY `id_mesa` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;
--
-- AUTO_INCREMENT de la tabla `tm_pedido`
--
ALTER TABLE `tm_pedido`
  MODIFY `id_pedido` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;
--
-- AUTO_INCREMENT de la tabla `tm_producto`
--
ALTER TABLE `tm_producto`
  MODIFY `id_prod` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=63;
--
-- AUTO_INCREMENT de la tabla `tm_producto_catg`
--
ALTER TABLE `tm_producto_catg`
  MODIFY `id_catg` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;
--
-- AUTO_INCREMENT de la tabla `tm_producto_ingr`
--
ALTER TABLE `tm_producto_ingr`
  MODIFY `id_pi` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;
--
-- AUTO_INCREMENT de la tabla `tm_producto_pres`
--
ALTER TABLE `tm_producto_pres`
  MODIFY `id_pres` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=63;
--
-- AUTO_INCREMENT de la tabla `tm_proveedor`
--
ALTER TABLE `tm_proveedor`
  MODIFY `id_prov` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;
--
-- AUTO_INCREMENT de la tabla `tm_rol`
--
ALTER TABLE `tm_rol`
  MODIFY `id_rol` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;
--
-- AUTO_INCREMENT de la tabla `tm_salon`
--
ALTER TABLE `tm_salon`
  MODIFY `id_catg` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;
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
  MODIFY `id_med` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;
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
  MODIFY `id_usu` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;
--
-- AUTO_INCREMENT de la tabla `tm_venta`
--
ALTER TABLE `tm_venta`
  MODIFY `id_venta` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;
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

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
