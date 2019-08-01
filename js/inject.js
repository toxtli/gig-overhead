var firebaseConfig = {
	apiKey: "AIzaSyC00cL8EiHK-lCmyak2AS_dQdkFhiufhik",
	authDomain: "mturk-research.firebaseapp.com",
	databaseURL: "https://mturk-research.firebaseio.com",
	projectId: "mturk-research",
	storageBucket: "mturk-research.appspot.com",
	messagingSenderId: "268474160818",
	appId: "1:268474160818:web:6644d78d14e7dcf9"
};

firebase.initializeApp(firebaseConfig);

function storeObject(obj) {
	var db = firebase.firestore();
	obj = JSON.parse(obj);
	db.collection("records").add(obj)
	.then(docRef => {
	  console.log("Document written with ID: ", docRef.id);
	})
	.catch(error => {
	  console.error("Error adding document: ", error);
	});
}