self.addEventListener('fetch', function(event){
    // console.log([event.request]);
    // console.log('Hellos');
    event.respondWith(
        // new Response('Hello world')
        fetch(event.request).then(function(response){
            if (response.status == 404) {
                return new Response("Whoops, not found!");
            }
            return response;
        }).catch(function(){
            return new Response("Uh oh, that totally failed!");
        })
    );
});