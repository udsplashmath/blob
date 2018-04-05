(function() {

  Model.writingIntoDatabaseCounter = 0;

  function Model() {}


  Base.extend(Model);

  /**
	 * Overriding the base extend method to add the prepare part
	 * @param {Object} subClass
	 */
  Model.extend = function(sub_class) {
    Base.extend.call(this, sub_class);

    if (sub_class._table_name === undefined) {
      sub_class._table_name = $.string.toUnderScore(sub_class.name) + "s";
    }

    if (sub_class._finders) {
      _prepareFinders(sub_class);
    }

    sub_class.all = [];
  };

  /*********************CLASS METHODS****************************/

  /**
	 * Primary key for the entity class
	 */
  Model.primaryKey = function() {
    return this._primary_key === undefined ? "id" : this._primary_key;
  };

  /**
	 * Find by primary key
	 * @param {Object} options
	 * @param {Function} callback
	 */
  Model.find = function(value) {
    if($.isArray(value)) {
      return Model.findAllByColumnName(this.primaryKey(), value);
    } else {
      return this.findByColumnName(this.primaryKey(), value);
    }
  };

  /**
	 * Find all rows
	 * @param {Object} values - should be an array of primary key values
	 * @param {Function} callback
	 */
  Model.findAll = function(values) {
   	if(!values) {
   		return this.all;
   	} else {
   		return this.findAllByColumnName(this.primaryKey(), values);
   	}
  };

  /**
	 * Find by columm name
	 * @param {String} columnName
	 * @param {Object} value
	 * @param {Function} callback
	 */
  Model.findByColumnName = function(columnName, value) {
    var options = {};
    value = $.isArray(value) ? value[0] : value;
    options[columnName] = value;
    return this.findAllByOptions(options, true);
  };

  /**
	 * Find all by column name
	 * @param {String} columnName
	 * @param {Object} value
	 * @param {Function} callback
	 */
  Model.findAllByColumnName = function(columnName, value) {
    var options = {};
    options[columnName] = value;
    return this.findAllByOptions(options);
  };

  /**
	 * Find based on given options
	 * @param {Object} options key value pairs
	 */
  Model.findByOptions = function(options) {
    return this.findAllByOptions(options, true);
  };

  /**
	 * Find all based on given options
	 * @param {Object} options
	 */
  Model.findAllByOptions = function(options, onlyFirst) {
    var instances = [];
    if (this.all && this.all.length > 0) {
      for (var i = 0; i < this.all.length; i++) {
        var instance = this.all[i];
        var match = true;
        //check if all keys are matching
        for (var key in options) {
          if (options.hasOwnProperty(key)) {
            if($.isArray(options[key])) {
              match = match && (options[key].indexOf(instance[key]) >= 0);
            } else if(typeof options[key] == "function") {
              match = match && (options[key].call(this, instance));
            } else {
              match = match && (instance[key] === options[key]);
            }
          }
        }
        //found a match
        if(match) {
          if (onlyFirst) {
            //return the first match (findBy)
            return instance;
          } else {
            //store the instance (findAllBy)
            instances.push(instance);
          }
        }
      }
    }
    return onlyFirst ? instances[0] : instances;
  };

  /**
	 * Load all from db to memory
	 */
  Model.load = function(options, callback) {
    if(typeof(options) == "function") {
      callback = options;
      options  = {};
    } else {
      options = options || {};
    }

    var that = this;
    var defaultScopeMap = {
      "deleted_at": "IS NULL",
      "discarded_at": "IS NULL",
      "deleted": "IS NULL OR deleted = 0"
    };

    // Define deafult scopes by default based on columns deleted_at, discarded_at and deleted
    for(var columnName in defaultScopeMap) {
      if(defaultScopeMap.hasOwnProperty(columnName) && that._column_names.indexOf(columnName) >= 0) {
        options.conditions = appendCondition(options.conditions, "(" + columnName + " " + defaultScopeMap[columnName] + ")");
      }
    }

    if(this._default_scope) {
      options.conditions = appendCondition(options.conditions, this._default_scope);
    }
		
    SPMathDB.findAll(this._table_name, options, function(rows) {
      if(that["all"] === undefined) { that.all = []; }
      var new_rows = rows.map(function(row) {
        var ele = that.find(row.id);
        if(ele) {
          return ele;
        } else {
          return new that($.extend(true, {}, row));
        }
      });

      that["all"] = $.array.subtract(that["all"], new_rows, that.equals);
      that["all"] = that["all"].concat(new_rows);
      callback && callback();
    });
  };

  /**
	 * Check if 2 database entities are same
	 */
  Model.equals = function(inst1, inst2) {
    return inst1.id == inst2.id;
  };

  /**
	 * load all from db where id in ids
	 * @param {Array} ids
	 * @param {Function} callback
	 */
  Model.loadAll = function(column_name, ids, callback) {
    var options = {};

    if($.isArray(ids)) {
      ids = $.array.select(ids, function(id) {
        return id !== null && id !== undefined && id.length != 0;
      });
      options.conditions = column_name + " in ('" + ids.join("','") + "')";

    } else {
      options.where = {};
      options.where[column_name] = ids;
    }

    this.load(options, callback);
  };

  /**
	 * Create a new object given in memory instance
	 * @param {Object} instance
	 * @param {Function} callback
	 */
  Model.create = function(instance, callback) {
    // console.log("Model create counter" + Model.writingIntoDatabaseCounter);
    Model.writingIntoDatabaseCounter++;
    var insert_data;
    var now_time = $.date.now();
    var klass = this;

    instance.id = SPUtil.uuid();

    if(this._column_names.indexOf("created_at") >= 0) {
      instance.created_at = now_time;
    }

    if(this._column_names.indexOf("updated_at") >= 0) {
      instance.updated_at = now_time;
    }

    insert_data = instance.dump();

    if(BUILD && WRITE_ID_TABLES.indexOf(this._table_name) >= 0) {
      if(AppHelper.exists(MEM.write_id)) {
        insert_data.write_id = MEM.write_id;
      } else {
        alert("write id not found " + MEM.write_id);
      }
    }

    insert_data = encodeBool(insert_data, this._bool_columns);

    SPMathDB.insert(this._table_name, insert_data, function(options) {
      klass.all.push(instance);
      callback && callback();
      Model.writingIntoDatabaseCounter--;
    });
  };

  /**
	 * alias for create
	 * @param {Object} instance
	 * @param {Object} callback
	 */
  Model.insert = function(instance, callback) {
    this.create(instance, callback);
  };

  /**
	 * Delete rows from db based on options
	 * @param {Object} table
	 */
  Model.deleteRows = function(options, callback) {
    SPMathDB.deleteRows(this._table_name, options, callback);
  };

  /**
	 * update self and all related entitites given by foreign key map (fks)
	 */
  Model.updateOnConflict = function(data, fks) {
    var primaryKey = this.primaryKey();

    if(data) {
      if(data.constructor != Array) {
        data = [data];
      }

      for(var i in data) {
        var conflict = data[i];
        var rows = this.findAllByColumnName(primaryKey, conflict["client_id"]);
        rows.forEach(function(row) {
          row.updatePrimaryKey(conflict["server_id"]);
        });

        for(var model in fks) {
          var key = fks[model];
          var modelObj = window[model];
          var fkRows = modelObj.findAllByColumnName(key, conflict["client_id"]);
          fkRows.forEach(function(row) {
            row.updateAttribute(key, conflict["server_id"]);
          });
        }
      }
    }
  };

  /*********************INSTANCE METHODS****************************/

  /**
	 * Populate a new instance from seed
	 * @param {Object} obj
	 */
  Model.prototype.init = function(seed) {
    this.column_names = this._klass._column_names;
    this.table_name = this._klass._table_name;
    var attrs = this.column_names;

    seed = seed || {};
    seed = decodeBool(seed, this._klass._bool_columns);

    if(seed[this._klass.primaryKey()] === undefined) {
      //new object in memory
      //assume that reading from db will have correct values fro default columns
      seed = setDefaults(seed, this._klass._defaults);
    }

    if (attrs) {
      for (var i = 0; i < attrs.length; i++) {
        this[attrs[i]] = seed[attrs[i]] === undefined ? null : seed[attrs[i]];
      }
    }

    if(STORE_POPULATED) {
      Associations.bind.one(this);
    }
  };

  /**
	 * Save the model to db
	 * @param {Function} callback
	 */
  Model.prototype.save = function(callback) {
    if (this.newRecord()) {
      this._klass.create(this, callback);
    } else {
      this.update(callback);
    }
  };

  /**
	 * Update in db
	 * @param {Function} callback
	 */
  Model.prototype.update = function(callback) {
    updateModel(this, this.dump(), callback);
  };

  /**
   * Update an attribute
   */
  Model.prototype.updateAttribute = function(attr, value) {
    var set = {};
    if (typeof(attr) == "object") {
      set = attr;
    } else {
      set[attr] = value;
    }
    this.updateAttributes(set);
  };

  /**
	 * Update multiple attributes key value pairs
	 */
  Model.prototype.updateAttributes = function(updateOptions) {
    for(var key in updateOptions) {
      if(updateOptions.hasOwnProperty(key) && this.column_names.indexOf(key) >= 0) {
        this[key] = updateOptions[key];
      }
    }
    updateModel(this, updateOptions);
  };

  /**
	 *
	 */
  Model.prototype.updatePrimaryKey = function(new_value) {
    Model.writingIntoDatabaseCounter++;
    var obj = this;
    var set = {};
    var primaryKey = this._klass.primaryKey();

    set[primaryKey]=new_value;

    if(obj.column_names.indexOf("updated_at") >= 0) {
      obj.updated_at = $.date.now();
      set.updated_at = obj.updated_at;
    }

    set = fillEmptyWithNull(set, obj._column_names);

    if(BUILD && WRITE_ID_TABLES.indexOf(obj.table_name) >= 0) {
      if(AppHelper.exists(MEM.write_id)) {
        set.write_id = MEM.write_id;
      } else {
        alert("write id not found");
      }
    }

    set = encodeBool(set, obj._klass._bool_columns);

    var setOptions = {
      set : set,
      where : {id: obj.id}
    };

    SPMathDB.update(obj.table_name, setOptions, function(){
      Model.writingIntoDatabaseCounter--;
      obj[primaryKey] = new_value;
    });
  };

  /**
	 * Delete the object from memory and db
	 */
  Model.prototype.destroy = function(callback) {
    var options = {};
    var that = this;

    options[this.primaryKey()] = this[this.primaryKey()];

    if(this.column_names.indexOf("deleted_at") >= 0) {
      this.deleted_at = $.date.now();
    }

    this._klass.deleteRows(options, function() {
      that._klass.all = $.array.subtract(that._klass.all, [that]);
      typeof (callback) == "function" && callback();
    });
  };

  /**
	 * Get attribute values for this object as a plain object
	 */
  Model.prototype.dump = function() {
    var dump = {};
    var columns = this.column_names;
    if (columns) {
      for (var i = 0; i < columns.length; i++) {
        dump[columns[i]] = this[columns[i]];
      }
    }
    return dump;
  };

  /**
	 * Check if the record is not persisted in db
	 */
  Model.prototype.newRecord = function() {
    return (this.id === undefined || this.id === null) ? true : false;
  };

  /*********************ASSOCIATION METHODS****************************/

  /**
	 * belongs to association, foreign key in this table
	 */
  Model.belongsTo = function(prop_name, options) {
    Associations.declare.belongsTo(this.name, prop_name, options);
  };

  /**
	 * has one association, foreign key in association table
	 */
  Model.hasOne = function(prop_name, options) {
    Associations.declare.hasOne(this.name, prop_name, options);
  };

  /**
	 * has many association, foreign key in association table
	 */
  Model.hasMany = function(prop_name, options) {
    Associations.declare.hasMany(this.name, prop_name, options);
  };

  /*********************PRIVATE METHODS****************************/

  /**
	 * Genarate a uuid
	 */
  // uuid = function() {
  // 	var rfc4_id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
  //    	var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
  //    	return v.toString(16);
  //    });
  //    return rfc4_id.replace(/-/g, "").toUpperCase();
  // }

  /**
	 * Make an update query
	 */
  function updateModel(obj, set, callback) {
    // console.log("Model update counter " + Model.writingIntoDatabaseCounter);
    Model.writingIntoDatabaseCounter++;
    if(obj.column_names.indexOf("updated_at") >= 0) {
      obj.updated_at = $.date.now();
      set.updated_at = obj.updated_at;
    }

    set = fillEmptyWithNull(set, obj._column_names);

    if(BUILD && WRITE_ID_TABLES.indexOf(obj.table_name) >= 0) {
      if(AppHelper.exists(MEM.write_id)) {
        set.write_id = MEM.write_id;
      } else {
        alert("write id not found");
      }
    }

    set = encodeBool(set, obj._klass._bool_columns);

    var setOptions = {
      set : set,
      where : {id: obj.id}
    };

    SPMathDB.update(obj.table_name, setOptions, function(){
      Model.writingIntoDatabaseCounter--;
      callback && callback();
    });
  }

 	function encodeBool(obj, bool_columns) {
    var attr;
    for(var i = 0; i < bool_columns.length; i++) {
      attr = bool_columns[i];
      if(obj.hasOwnProperty(attr) && obj[attr] != null) {
        obj[attr] = AppHelper.checkBool(obj[attr]) ? 1 : 0;
      }
    }
    return obj;
  }

  function decodeBool(obj, bool_columns) {
    var attr;
    var val;
    for(var i = 0; i < bool_columns.length; i++) {
      attr = bool_columns[i];
      if(obj.hasOwnProperty(attr) && obj[attr] !== null && obj[attr] !== undefined) {
        val = $.trim(obj[attr].toString()).toLowerCase();
        obj[attr] = (val === "t" || val === "1" || val === "true" || val === true);
      }
    }
    return obj;
  }

  /**
	 * define finders
	 * @param {Object} subClass
	 */
  function _prepareFinders(sub_class) {
    var keys = sub_class._finders;
    var key;
    var func_key;
    var func_names = ["", "All"];

    for (var i = 0; i < keys.length; i++) {
      key = keys[i];

      if (!$.isArray(key)) {
        key = [key];
      }

      func_key = key.map(function(a) {
        return formatKey(a);
      }).join("And");

      for(var j = 0; j < func_names.length; j++) {
        sub_class["find"  + func_names[j] + "By" + func_key] = (function(fname, keys) {
          return function() {
            var options = {};
            for(var i = 0; i < keys.length; i++) {
              options[keys[i]] = arguments[i];
            }
            return this["find" + fname + "ByOptions"](options);
          };
        })(func_names[j], key);
      }
    }
  }

  function setDefaults(obj, default_values) {
    for(var column in default_values) {
      if(default_values.hasOwnProperty(column)) {
        if(obj[column] === undefined) {
          obj[column] = default_values[column];
        }
      }
    }
    return obj;
  }

  /**
	 * format the key to be used as a part of a finder function name
	 * camelcase with first letter in caps (like a class name)
	 * e.g. skill_id => SkillId => like in findBySkillId etc
	 */
  function formatKey(key) {
    key = $.string.toCamelCase(key);
    return key.substr(0, 1).toUpperCase() + key.substr(1);
  }

  function fillEmptyWithNull(object, columns) {
    if (columns) {
      for (var i = 0; i < columns.length; i++) {
        if (object[columns[i]] === undefined) {
          object[columns[i]] = null;
        }
      }
    }
    return object;
  }

  function appendCondition(conditions, condition) {
    if(conditions) {
      conditions += " AND " + condition;
    } else {
      conditions = condition;
    }

    return conditions;
  }

  window.Model = Model;

})(window);
