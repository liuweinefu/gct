/*
Navicat MySQL Data Transfer

Source Server         : local
Source Server Version : 100108
Source Host           : localhost:3306
Source Database       : gct

Target Server Type    : MYSQL
Target Server Version : 100108
File Encoding         : 65001

Date: 2017-03-03 09:10:20
*/

SET FOREIGN_KEY_CHECKS=0;

-- ----------------------------
-- Table structure for commodity
-- ----------------------------
DROP TABLE IF EXISTS `commodity`;
CREATE TABLE `commodity` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '商品ID',
  `name` varchar(255) DEFAULT NULL COMMENT '商品名',
  `commodity_type_id` int(11) NOT NULL COMMENT '商品类型ID',
  `price` decimal(10,2) DEFAULT NULL COMMENT '价格',
  `count` int(255) DEFAULT NULL COMMENT '存量',
  `remark` varchar(255) DEFAULT NULL COMMENT '备注',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `last_update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `commodity_name` (`name`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8 COMMENT='商品';

-- ----------------------------
-- Records of commodity
-- ----------------------------
INSERT INTO `commodity` VALUES ('1', '足底', '1', '120.00', '950', '', '2017-02-22 13:27:12', '2017-03-02 16:18:49');
INSERT INTO `commodity` VALUES ('2', '针灸', '1', '200.00', '10001', null, '2017-02-22 13:27:12', '2017-03-02 16:18:49');
INSERT INTO `commodity` VALUES ('3', '熏蒸', '1', '50.00', '10006', '', '2017-02-22 13:27:12', '2017-03-02 16:18:49');
INSERT INTO `commodity` VALUES ('4', '红酒1', '3', '110.00', '89', '', '2017-02-22 13:27:12', '2017-03-01 17:10:47');
INSERT INTO `commodity` VALUES ('5', '红酒2', '3', '500.00', '8', null, '2017-03-01 16:18:10', '2017-03-02 16:17:06');

-- ----------------------------
-- Table structure for commodity_recharge
-- ----------------------------
DROP TABLE IF EXISTS `commodity_recharge`;
CREATE TABLE `commodity_recharge` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '商品入库记录',
  `commodity_id` int(11) unsigned NOT NULL COMMENT '商品id',
  `commodity_name` varchar(255) DEFAULT NULL COMMENT '商品名',
  `commodity_count` int(11) DEFAULT NULL COMMENT '商品量',
  `commodity_price` decimal(10,0) DEFAULT NULL COMMENT '商品售价',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '入库时间',
  `recharge_count` int(11) unsigned DEFAULT NULL COMMENT '入库数量',
  `recharge_single_price` decimal(10,0) DEFAULT NULL COMMENT '入库单价',
  `recharge_all_price` decimal(10,0) DEFAULT NULL COMMENT '入库总价',
  `remark` varchar(255) DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='商品入库记录';

-- ----------------------------
-- Records of commodity_recharge
-- ----------------------------

-- ----------------------------
-- Table structure for commodity_type
-- ----------------------------
DROP TABLE IF EXISTS `commodity_type`;
CREATE TABLE `commodity_type` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '商品类型id',
  `name` varchar(255) NOT NULL COMMENT '商品类型',
  PRIMARY KEY (`id`),
  UNIQUE KEY `commodity_type_name` (`name`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of commodity_type
-- ----------------------------
INSERT INTO `commodity_type` VALUES ('2', '保健品类');
INSERT INTO `commodity_type` VALUES ('4', '其他');
INSERT INTO `commodity_type` VALUES ('1', '服务类');
INSERT INTO `commodity_type` VALUES ('3', '红酒类');

-- ----------------------------
-- Table structure for member
-- ----------------------------
DROP TABLE IF EXISTS `member`;
CREATE TABLE `member` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '会员ID',
  `name` varchar(255) NOT NULL COMMENT '会员名',
  `card_id` int(11) unsigned NOT NULL COMMENT '会员卡号',
  `pass` varchar(255) DEFAULT NULL COMMENT '密码',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '入会时间',
  `member_role_id` int(11) DEFAULT '1' COMMENT '会员类型',
  `balance` decimal(10,2) DEFAULT '0.00' COMMENT '余额',
  `phone` varchar(255) DEFAULT NULL COMMENT '手机号码',
  `other_contacts` varchar(255) DEFAULT NULL COMMENT '其他联系方式',
  `remark` varchar(255) DEFAULT NULL COMMENT '备注',
  `member_case` text COMMENT '治疗方案',
  `member_case_remark` text COMMENT '治疗描述',
  PRIMARY KEY (`id`),
  UNIQUE KEY `member_name` (`name`),
  UNIQUE KEY `member_card_id` (`card_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8 COMMENT='会员';

-- ----------------------------
-- Records of member
-- ----------------------------
INSERT INTO `member` VALUES ('1', '无卡用户', '999', '', '2017-01-08 11:30:26', '5', '2136.00', '13354561234', '0451-8888888;0451-7777777', '', '我们 天天 123 高兴 f', null);

-- ----------------------------
-- Table structure for member_consumption
-- ----------------------------
DROP TABLE IF EXISTS `member_consumption`;
CREATE TABLE `member_consumption` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '会员消费记录id',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '消费时间',
  `price` decimal(10,2) DEFAULT NULL COMMENT '消费金额',
  `count` int(11) unsigned DEFAULT NULL COMMENT '商品数量',
  `is_discount` tinyint(4) unsigned DEFAULT NULL COMMENT '是否打折',
  `is_cash` tinyint(4) unsigned DEFAULT NULL COMMENT '是否现金',
  `commodity_id` int(11) unsigned NOT NULL COMMENT '商品id',
  `commodity_name` varchar(255) DEFAULT NULL COMMENT '商品名',
  `commodity_price` decimal(10,2) DEFAULT NULL,
  `member_id` int(11) unsigned DEFAULT NULL COMMENT '会员ID',
  `member_name` varchar(255) DEFAULT NULL COMMENT '会员名',
  `write_user_id` int(11) unsigned NOT NULL COMMENT '记录员工id',
  `write_user_name` varchar(255) DEFAULT NULL COMMENT '记录员工',
  `service_user_id` int(11) unsigned NOT NULL COMMENT '服务员工id',
  `service_user_name` varchar(255) DEFAULT NULL COMMENT '服务员工',
  `is_close` tinyint(4) DEFAULT '0' COMMENT '是否已结算',
  `remark` varchar(255) DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='会员消费记录';

-- ----------------------------
-- Records of member_consumption
-- ----------------------------

-- ----------------------------
-- Table structure for member_recharge
-- ----------------------------
DROP TABLE IF EXISTS `member_recharge`;
CREATE TABLE `member_recharge` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '充值记录id',
  `member_id` int(11) unsigned NOT NULL COMMENT '会员id',
  `member_name` varchar(255) DEFAULT NULL COMMENT '会员',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '充值时间',
  `write_user_id` int(11) unsigned NOT NULL COMMENT '记录员工ID',
  `write_user_name` varchar(255) DEFAULT NULL COMMENT '记录员工',
  `recharge_price` decimal(10,0) DEFAULT NULL COMMENT '充值金额',
  `remark` varchar(255) DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='会员充值记录';

-- ----------------------------
-- Records of member_recharge
-- ----------------------------

-- ----------------------------
-- Table structure for member_role
-- ----------------------------
DROP TABLE IF EXISTS `member_role`;
CREATE TABLE `member_role` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '会员类型ID',
  `name` varchar(254) NOT NULL COMMENT '会员类型',
  `discount` decimal(10,2) unsigned NOT NULL DEFAULT '0.00' COMMENT '折扣率',
  `remark` varchar(255) DEFAULT NULL COMMENT '会员类型备注',
  PRIMARY KEY (`id`),
  UNIQUE KEY `member_role_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8 COMMENT='会员类型';

-- ----------------------------
-- Records of member_role
-- ----------------------------
INSERT INTO `member_role` VALUES ('1', '普通会员', '1.00', '无预存款');
INSERT INTO `member_role` VALUES ('2', '银卡会员', '0.90', '存款10000');
INSERT INTO `member_role` VALUES ('3', '金卡会员', '0.80', '存款20000');
INSERT INTO `member_role` VALUES ('4', '黑卡会员', '0.70', '存款40000');
INSERT INTO `member_role` VALUES ('5', '钻石会员', '0.65', '存款100000');
INSERT INTO `member_role` VALUES ('6', 'vip会员', '0.60', '存款200000');

-- ----------------------------
-- Table structure for privilege
-- ----------------------------
DROP TABLE IF EXISTS `privilege`;
CREATE TABLE `privilege` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '权限ID',
  `name` varchar(255) NOT NULL COMMENT '权限名',
  `url` varchar(255) DEFAULT NULL COMMENT 'url',
  `type` varchar(255) DEFAULT NULL COMMENT '类型(menu,button,power)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `privilege_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8 COMMENT='权限';

-- ----------------------------
-- Records of privilege
-- ----------------------------
INSERT INTO `privilege` VALUES ('1', '日常应用', '', 'menu');
INSERT INTO `privilege` VALUES ('2', '首页', 'mix', 'menu');
INSERT INTO `privilege` VALUES ('3', '退出', 'logout', 'menu');
INSERT INTO `privilege` VALUES ('4', '综合管理', '', 'menu');
INSERT INTO `privilege` VALUES ('5', '员工管理', 'user', 'menu');
INSERT INTO `privilege` VALUES ('6', '会员管理', 'member', 'menu');
INSERT INTO `privilege` VALUES ('7', '商品管理', 'commodity', 'menu');
INSERT INTO `privilege` VALUES ('8', '记录浏览', '', 'menu');
INSERT INTO `privilege` VALUES ('9', '员工工资记录', 'userWage', 'menu');
INSERT INTO `privilege` VALUES ('10', '会员消费记录', 'memberConsumption', 'menu');
INSERT INTO `privilege` VALUES ('11', '商品入库记录', 'commodityRecharge', 'menu');
INSERT INTO `privilege` VALUES ('12', '会员充值记录', 'memberRecharge', 'menu');
INSERT INTO `privilege` VALUES ('13', '系统设置', '', 'menu');
INSERT INTO `privilege` VALUES ('14', '基本权限设置', 'privilege', 'menu');
INSERT INTO `privilege` VALUES ('15', '员工类型设置', 'userRole', 'menu');
INSERT INTO `privilege` VALUES ('16', '会员类型设置', 'memberRole', 'menu');
INSERT INTO `privilege` VALUES ('17', '商品类型设置', 'commodityType', 'menu');

-- ----------------------------
-- Table structure for user
-- ----------------------------
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '用户id',
  `name` varchar(255) NOT NULL COMMENT '用户名	',
  `pass` varchar(255) NOT NULL COMMENT '密码',
  `user_role_id` int(11) unsigned NOT NULL DEFAULT '1' COMMENT '员工类型id',
  `phone` varchar(255) DEFAULT '' COMMENT '手机',
  `other_contacts` varchar(255) DEFAULT '' COMMENT '其他联系方式',
  `remark` varchar(255) DEFAULT NULL COMMENT '备注',
  `last_login_time` datetime DEFAULT NULL COMMENT '最后登录时间',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_name` (`name`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8 COMMENT='员工';

-- ----------------------------
-- Records of user
-- ----------------------------
INSERT INTO `user` VALUES ('1', 'admin', '7fef6171469e80d32c0559f88b377245', '2', '13936248323', '0451-88888888;0451-88888888', '', '2017-03-02 16:15:22', '2017-02-22 13:34:42');
INSERT INTO `user` VALUES ('2', 'guan', 'e10adc3949ba59abbe56e057f20f883e', '4', '12345678901', '0451-88888888;0451-88888888', '', '2017-02-26 17:53:23', '2017-02-22 13:34:42');
INSERT INTO `user` VALUES ('3', 'ning', 'e10adc3949ba59abbe56e057f20f883e', '3', '12345678901', '0451-88888888;0451-88888888', '', '2017-02-26 17:56:08', '2017-02-22 13:34:42');
INSERT INTO `user` VALUES ('4', 'liu', 'e10adc3949ba59abbe56e057f20f883e', '7', '12345678901', '0451-88888888;0451-88888888', '', '2017-02-26 17:55:56', '2017-02-22 13:34:42');
INSERT INTO `user` VALUES ('5', 'chen', 'e10adc3949ba59abbe56e057f20f883e', '8', '12345678900', '0451-88888888;0451-88888888', '', '2017-02-25 13:44:54', '2017-02-22 13:34:42');
INSERT INTO `user` VALUES ('6', 'qiantai', 'e10adc3949ba59abbe56e057f20f883e', '6', '12345678910', '', null, '2017-02-26 17:55:02', '2017-02-26 17:05:21');

-- ----------------------------
-- Table structure for user_role
-- ----------------------------
DROP TABLE IF EXISTS `user_role`;
CREATE TABLE `user_role` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '角色ID',
  `name` varchar(255) NOT NULL COMMENT '员工类型',
  `base_wage` decimal(10,2) DEFAULT '0.00' COMMENT '底薪',
  `privileges` text COMMENT '权限列表',
  `menus` text COMMENT '菜单栏',
  `tabs` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_role_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8 COMMENT='员工类型';

-- ----------------------------
-- Records of user_role
-- ----------------------------
INSERT INTO `user_role` VALUES ('1', '新员工', '0.00', '', '', '');
INSERT INTO `user_role` VALUES ('2', '管理员', '0.00', '1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17', '1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17', '');
INSERT INTO `user_role` VALUES ('3', '总经理', '5000.00', '1,2,3,4,5,6,7,8,9,10,11,12,13,15,16,17', '1,2,3,4,5,6,7,8,9,10,11,12,13,15,16,17', '');
INSERT INTO `user_role` VALUES ('4', '店长', '3500.00', '1,2,3,4,5,6,7,8,9,10,11,12', '1,2,3,4,5,6,7,8,9,10,11,12', '');
INSERT INTO `user_role` VALUES ('5', '会计', '3500.00', '8,9,10,11,12', '8,9,10,11,12', '');
INSERT INTO `user_role` VALUES ('6', '前台', '2000.00', '1,2,3', '1,2,3', '2');
INSERT INTO `user_role` VALUES ('7', '一级技师', '2000.00', '1,2,3', '1,2,3', '2');
INSERT INTO `user_role` VALUES ('8', '二级技师', '2000.00', '1,2,3', '1,2,3', '2');
INSERT INTO `user_role` VALUES ('9', '三级技师', '2000.00', '1,2,3', '1,2,3', '2');
INSERT INTO `user_role` VALUES ('10', '四级技师', '2000.00', '1,2,3', '1,2,3', '2');

-- ----------------------------
-- Table structure for user_wage
-- ----------------------------
DROP TABLE IF EXISTS `user_wage`;
CREATE TABLE `user_wage` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '工资id',
  `user_id` int(11) unsigned NOT NULL COMMENT '用户id',
  `user_name` varchar(255) NOT NULL COMMENT '用户名',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `base_wage` decimal(10,2) DEFAULT '0.00' COMMENT '底薪',
  `deduction_wage` decimal(10,2) DEFAULT '0.00' COMMENT '奖金',
  `member_consumption_ids` text COMMENT '会员消费记录集合；'',''分割',
  `remark` varchar(255) DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='员工';

-- ----------------------------
-- Records of user_wage
-- ----------------------------

-- ----------------------------
-- View structure for view_commodity
-- ----------------------------
DROP VIEW IF EXISTS `view_commodity`;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER  VIEW `view_commodity` AS SELECT
commodity.id,
commodity.`name`,
commodity.price,
commodity.count,
commodity.remark,
commodity_type.`name` AS commodity_type_name,
commodity.commodity_type_id
FROM
commodity
INNER JOIN commodity_type ON commodity_type.id = commodity.commodity_type_id ;

-- ----------------------------
-- View structure for view_member
-- ----------------------------
DROP VIEW IF EXISTS `view_member`;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER  VIEW `view_member` AS SELECT
member.id,
member.`name`,
member.card_id,
member.pass,
member.create_time,
member.balance,
member.phone,
member.other_contacts,
member.remark,
member.member_role_id,
member_role.`name` AS member_role_name,
member.member_case,
member.member_case_remark,
member_role.discount
FROM
member
INNER JOIN member_role ON member.member_role_id = member_role.id ;

-- ----------------------------
-- View structure for view_user
-- ----------------------------
DROP VIEW IF EXISTS `view_user`;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER  VIEW `view_user` AS SELECT
`user`.id,
`user`.`name`,
`user`.pass,
`user`.user_role_id,
`user`.phone,
`user`.other_contacts,
`user`.last_login_time,
`user`.remark,
user_role.`name` AS user_role_name,
user_role.base_wage,
user_role.`privileges`,
user_role.menus,
user_role.tabs
FROM
`user`
INNER JOIN user_role ON `user`.user_role_id = user_role.id ;
