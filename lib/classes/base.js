(function(){

  function Base() {
    this._klass = "Base";
  }

  /**
	 * Extend this to a sub class
	 * @param {Object} sub_klass
	 */
  Base.extend = function(sub_klass) {
    var base = new this();
    sub_klass.prototype = base;
    sub_klass.prototype._klass = sub_klass;
    sub_klass.prototype._klass_name = sub_klass.name;
    sub_klass.prototype.constructor = sub_klass;

    sub_klass._super_klass = this;
    this._sub_klasses = this._sub_klasses || [];
    this._sub_klasses.push(sub_klass);
		
    sub_klass.extend = arguments.callee;
    sub_klass.getSubClasses = Base.subClasses;

    // copy the class functions and properties to subclass
    // do not copy the extend method and again
    // do not copy properties with leading underscores(privates)
    for(var prop in this) {

      if(this.hasOwnProperty(prop) && prop !== "extend" && !prop.match(/_.*/)) {

        var val = this[prop];

        if(typeof(val) == "function") {
          sub_klass[prop] = val;

        } else if(val instanceof Array) {
          sub_klass[prop] = [].concat(val);

        } else if(typeof(prop) == "object") {
          sub_klass[prop] = $.extend(true, {}, val);

        } else {
          sub_klass[prop] = val;
        }
      }
    }
  };
	
  /**
	 * Get a list of subclasses
	 */
  Base.getSubClasses = function() {
    return this._sub_klasses;
  };

  /**
	 * Clone the function- yields an identical method but a new reference
	 * @param {Object} fn
	 */
  function clone(fn) {
    var fns = "return " + fn.toString();
    var newFunc = new Function(fns);
    return newFunc();
  }

  window.Base = Base;

})(window);
