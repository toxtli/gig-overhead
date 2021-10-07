$(".control").on("click", ()=>{
    setChromeLocal(this.id, $(this).val()).then(()=>{
        console.log($(this).val());
    });
    console.log(this.id);
})