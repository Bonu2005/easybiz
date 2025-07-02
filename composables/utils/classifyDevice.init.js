const classifyDevice = (type) => {
    const val = type?.toLowerCase();

    if (!val) return 'DESKTOP';

    const mobileKeywords = [
  
        'mobile', 'android', 'iphone', 'ipad', 'ipod', 'smartphone', 'tablet', 'touch',

      
        'apple', 'iphone', 'ipad', 'ipod', 'ios',

   
        'samsung', 'galaxy', 'note',

 
        'xiaomi', 'redmi', 'mi',

    
        'huawei', 'honor',

        
        'oppo', 'realme',

   
        'vivo',

        'pixel', 'nexus',


        'oneplus',

    
        'sony', 'xperia',

    
        'lg',

  
        'motorola', 'moto',

     
        'nokia', 'lumia',

  
        'lenovo',

    
        'zte',

     
        'meizu',

        'asus', 'zenfone',


        'alcatel',

  
        'tecno', 'infinix',

     
        'itel',


        'bq',

  
        'micromax',

        
        'lava',


        'coolpad',

        'gionee',

     
        'prestigio', 'fly', 'digma'
    ];


    for (const keyword of mobileKeywords) {
        if (val.includes(keyword)) return 'MOBILE';
    }

    return 'DESKTOP';
};

module.exports = classifyDevice;
