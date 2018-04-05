(function(window) {
		
  var Associations = {};
	
  Associations.store = {};
	
  Associations.klass_names = [];
	
  Associations.declare = {};
	
  Associations.bind = {};
	
  /***********Association declarations***************************/

  /**
	 * Add a has one association
	 */
  Associations.declare.hasOne = function(klass, prop_name, options) {
    var opts = {};
    options = options || {};
    opts.prop_name = prop_name;
    opts.class1 = klass;
    opts.class2 = options.class_name || $.string.toClassName(prop_name);
    opts.fk = options.foreign_key || $.string.toUnderScore(klass) + "_id";
    opts.type = "hasOne";
    addDeclaration(opts);
  };
	
  /**
	 * Add a has many association
	 */
  Associations.declare.hasMany = function(klass, prop_name, options) {
    var opts = {};
    options = options || {};
    opts.prop_name = prop_name;
    opts.class1 = klass;
    opts.class2 = options.class_name;
    opts.fk = options.foreign_key || $.string.toUnderScore(klass) + "_id";
    opts.through = options.through;
    opts.type = "hasMany";
    addDeclaration(opts);
  };
	
  /**
	 * Add a belongs to association
	 */
  Associations.declare.belongsTo = function(klass, prop_name, options) {
    var opts = {};
    options = options || {};
    opts.prop_name = prop_name;
    opts.class1 = klass;
    opts.class2 = options.class_name || $.string.toClassName(prop_name);
    opts.fk = options.foreign_key || $.string.toUnderScore(opts.class2) + "_id";
    opts.type = "belongsTo";
    addDeclaration(opts);
  };
	
  /***********Association bindings***************************/
	
  Associations.bind.all = function() {
    var klass;
    var store;
    for(var j = 0; j < Associations.klass_names.length; j++) {
      klass = window[Associations.klass_names[j]];
      store = klass.all || [];
      for(var i = 0; i < store.length; i++) {
        Associations.bind.one(store[i]);
      }
    }
  };
	
  Associations.bind.one = function(obj) {
    var defs;
    var def;
    var atype;
		
    var klass = obj._klass;
    if(Associations.klass_names.indexOf(klass.name) >= 0) {
      defs = Associations.store[klass.name];
      for(var i = 0; i < defs.length; i++) {
        def = defs[i];
        atype = def.type;
        if(["hasOne", "hasMany", "belongsTo"].indexOf(atype) >= 0) {
          var func = this[atype];
          func(obj, def);
        } 
      }
    }
  };
	
  Associations.bind.hasOne = function(obj, opts) {
    var class2Name = opts.class2;
    if(typeof(class2Name) == "function") {
      class2Name = opts.class2.call(obj);
    }

    if(class2Name) {
      obj[opts.prop_name] = window[class2Name].findByColumnName(opts.fk, obj[opts.prop_name + "_id"] || obj.id);	
    }
  };
	
  Associations.bind.belongsTo = function(obj, opts) {
    var class2Name = opts.class2;
    if(typeof(class2Name) == "function") {
      class2Name = opts.class2.call(obj);
    }

    if(class2Name) {
      obj[opts.prop_name] = window[class2Name].find(obj[opts.fk]);
    }
  };
	
  Associations.bind.hasMany = function(obj, opts) {
    if(AppHelper.blank(opts.through)) {
      obj[opts.prop_name] = window[opts.class2].findAllByColumnName(opts.fk, obj.id);
    } else {
      var through_klass = window[opts.through];
      if(through_klass) {
        var fk1 = opts.fk || $.string.toUnderScore(opts.class1) + "_id";
        var fk2 = opts.through_fk || $.string.toUnderScore(opts.class2) + "_id"; 
        var through_objs = through_klass.findAllByColumnName(fk1, obj.id);
        var class2_ids = $.array.pluck(through_objs, fk2);
        if(class2_ids.length) {
          obj[opts.prop_name] = window[opts.class2].findAll(class2_ids);
        } else {
          obj[opts.prop_name] = [];
        }
      }
    }
  };
	
  /***********Private Methods***************************/
	
  /**
	 * Add association declaration to the store 
   * @param {Object} options
	 */
  function addDeclaration(options) {
    var klass_name = options.class1;
    var store = Associations.store;
		
    if(store[klass_name] === undefined) {
      store[klass_name] = [];
      Associations.klass_names.push(klass_name);
    }
    store[klass_name].push(options);
  }
	
  window.Associations = Associations;

})(window);

