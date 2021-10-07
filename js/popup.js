$(".control").on("click", function(){
    console.log(this.id);
    setChromeLocal(this.id, $(this).val()).then(()=>{
        console.log($(this).val());
    });
    console.log(this.id);
})