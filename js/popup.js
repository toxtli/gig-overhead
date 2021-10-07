$("#saveButton").on("click", function(){
    $(".control").each(function(){
        console.log(this.id);
        setChromeLocal(this.id, $(this).val()).then(()=>{
            console.log($(this).val());
        });
    });
});