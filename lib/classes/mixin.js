(function(){

  function Mixin() {}

  /**
	 * Extend this to a sub class
	 * @param {Object} sub_klass
	 */
  Mixin.include = function(klass1, klass2) {

    // link the prototype function
		
    // link the class functions and properties to subclass
    // do not copy the extend method and again
    // do not copy properties with leading underscores(privates)
    for(var prop in klass1) {

      if(klass1.hasOwnProperty(prop) && !prop.match(/_.*/)) {

        var val = klass1[prop];

        if(typeof(val) == "function") {
          klass2.prototype[prop] = val;

          //} else if(val instanceof Array) {
          //klass2[prop] = [].concat(val);

          //} else if(typeof(prop) == "object") {
          //klass2[prop] = $.extend(true, {}, val);

          //} else {
          //klass2[prop] = val;
        }
      }
    }
  };

  window.Mixin = Mixin;

})(window);
