function getMetaData(){
	var metaData = document.getElementsByTagName("meta");
	var data = {}; 
	for (var i = 0 ; i < metaData.length ; i++){
		if(metaData[i].name.includes("product_id")){
			data.sku = metaData[i].content ;
		}
		if(metaData[i].name.includes("title")|| metaData[i].name.includes("name")){
			data.title = metaData[i].content ;
		}
		else if(metaData[i].name.includes("image")){
			data.image = metaData[i].content ;
		}
		else if(metaData[i].name.includes("price")){
			data.price = parseInt(metaData[i].content) ; 
		}
		else if(metaData[i].name.includes("stock")){
			data.isAvailable = parseInt(metaData[i].content) > 0 ;
		}
	}
	if(!data.title){
		try{
			data.title = document.head.querySelector("[property='og:title'][content]").content;
		}
		catch(e){
		}
	}
	if(!data.image){
		try{
			data.image = document.head.querySelector("[property='og:image'][content]").content;
		}
		catch(e){
		}
	}
	try{
	data.price = (document.head.querySelector("[property='product:price:amount'][content]").content);
	data.price = parseInt(data.price) ;
	}
	catch(error){

	}
	return data ;
}


function getJsonData(){
    var list = [] ;
    try{
        var Jsons = document.querySelectorAll('script[type="application/ld+json"]');
        for(var i = 0 ; i < Jsons.length ; i++){
            list.push(JSON.parse(Jsons[i].innerText)) ;
        } 
    }
	catch(error){
    }
    return list ;
}


function readJsonData(data,list){
	product = {} ;
	//extract product details 
	for(var i = 0 ; i < list.length ; i++){
		if(list[i]["@type"]=="Product"){
			product = list[i] ;
		}
	}
	if(!data.sku){
		data.sku = product && product.sku ;
		if(!data.sku)
			data.sku = product && product.productIdD ;  
	}
	if(product.price){
		data.price = parseInt(product.price) ;
	}
	if(product.name && !data.title){
        data.title = product.name ;
    }
    if(product.image && !data.image){
        data.image = product.image ;
    }
	if(!data.timestamp){
		try{
			temp = product.offers.priceValidUntil ;
			temp = new Date(temp).getTime()/1000;
			data.timestamp = temp ;
			
		}
		catch(error){}
		if(!data.timestamp){
			data.timestamp = 0 ;
		}
	}
	data.averageVote = getRating(product);

	data.totalVotes = getReviewCount(product);
	try{
		data.brand = getBrandNameHead(product);
	}
	catch(error){
		data.category = data && data.category ;
	}

	return data ;
}


function getReviewCount(product){
	totalVotes = product && product.aggregateRating ;
	totalVotes = product.aggregateRating && product.aggregateRating.reviewCount;
	totalVotes = parseInt(totalVotes) || 0 ;
	return totalVotes ;
}


function getRating(product){
	averageVote = product && product.aggregateRating ;
	averageVote = product.aggregateRating && product.aggregateRating.ratingValue;
	averageVote = parseFloat(averageVote) || 0.0 ; 
	return averageVote ; 
}


function getDiscount(data){
	try{
		prices = document.querySelectorAll("p.price");
		prices = prices && prices[0].children ;
		if(prices.length==2){
			del = prices[0].innerText ;
			ins = prices[1].innerText ;
			del = extractIntFromText(del);
			ins = extractIntFromText(ins);
			data.discount = ((del-ins) / del) * 100 ;
			data.price = ins ; 
			return data ;
		}
		else{
			data.price = extractIntFromText(prices[0].innerText) ;
			data.discount = 0 ;
			return data ; 
		}
	}
	catch(error){
	}
}


function extractIntFromText(elem) {
	if (!elem) {
	  return;
	}
	elem = elem
	  .toString()
	  .replace(/۰/g, '0')
	  .replace(/۱/g, '1')
	  .replace(/۲/g, '2')
	  .replace(/۳/g, '3')
	  .replace(/۴/g, '4')
	  .replace(/۵/g, '5')
	  .replace(/۶/g, '6')
	  .replace(/۷/g, '7')
	  .replace(/۸/g, '8')
	  .replace(/۹/g, '9')
	  .replace(/\D/g, '');
	elem = parseInt(elem, 10);
	return elem;
}


function getStock(){
	temp = document && document.getElementsByClassName("stock in-stock");
	return temp.length > 0  ; 
}


function getBrandNameHead(product){
	brand = product && product.brand ;
	brand = product.brand && product.brand.name ;
	return brand ;
}


function getBrandNameBody(){
	temp = document && document.querySelector("tr.woocommerce-product-attributes-item:nth-child(2) > td:nth-child(2) > p:nth-child(1)");
	return temp.innerText ;
}


function scrapeHead(){
	data = getMetaData() ;
	json = getJsonData();
	data = readJsonData(data,json);
	return data ; 
}


function getSKUBody(){
	temp = document && document.querySelector("#tab-description > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > p:nth-child(13)");
	temp = temp.innerText.split(" ") ;
	for(var i = 0 ; i < temp.length ; i++){
		if(temp[i] == "مجوز"){
			temp = temp[i+1] ; 
			break ;
		}
	}
	return temp ; 
}


function getBreadCrumbList(){
	breadCrumbs = document.querySelector(".woocommerce-breadcrumb");
	breadCrumbs = breadCrumbs.children ;
	crumbs = [];
	for(var i = 1 ; i < breadCrumbs.length-1 ; i++){
		crumbs.push(breadCrumbs[i].innerText);
	}
	return crumbs ;
}


function scrapeBody(data){
	data.isAvailable = getStock() ;
	data = getDiscount(data) || data ;
	try{
		if(!data.brand){
			data.brand = getBrandNameBody();
		}
	}
	catch(error){
	}
	try{
		if(!data.sku){
			data.sku = getSKUBody() ; 
		}
	}
	catch(error){
	}
	try{
		data.category = getBreadCrumbList();
	}
	catch(error){
	}
	return data ; 
}


function checkAllData(data){
	for (var [key, value] of Object.entries(data)) {
		if(typeof value === 'undefined'){
			return false ;
		}
	  }
	  return true ;
}
function scrapePage(){
	data = scrapeHead();
	data = scrapeBody(data);
	if(!checkAllData(data)){
		document.onreadystatechange = loaded() ;
	}  
	return data ;
}

function loaded(){
	if (document.readyState === 'complete') {
		data = scrapeHead();
		data = scrapeBody(data);
	}
}

