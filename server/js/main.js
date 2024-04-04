
window.onload = () => {
  const sendButton = document.getElementById('sendButton');
  const sendImages = document.getElementById('sendImages');
  sendButton.onclick = sendData;
  sendImages.onclick = sendImagesData;

  const dataChannelSend = document.querySelector('textarea#dataChannelSend');
  const dataChannelReceive = document.querySelector('textarea#dataChannelReceive');

  let pc = {};
  let sendChannel = {};
  const uniqueId = () => {
    const dateString = Date.now().toString(36);
    const randomness = Math.random().toString(36).substr(2);
    return dateString + randomness;
  };
  const signaling = new BroadcastChannel('webrtc');
  signaling.id =  uniqueId();
  signaling.onmessage = e => {
    switch (e.data.type) {
      case 'answer':
        console.log("ANSWER")
        handleAnswer(e.data);
        break;
      case 'candidate':
        console.log("CANDIDATE")
        handleCandidate(e.data);
        break;
      case 'ready':
        console.log(`New possible client id: ${e.data.id}`)
        startConnection(e.data.id);
        break;
      default:
        console.log('unhandled', e);
        break;
    }
  };
  function createPeerConnection(client_id) {
    pc[client_id] = new RTCPeerConnection();
    pc[client_id].onicecandidate = e => {
      const message = {
        type: 'candidate',
        candidate: null,
      };
      if (e.candidate) {
        message.candidate = e.candidate.candidate;
        message.sdpMid = e.candidate.sdpMid;
        message.sdpMLineIndex = e.candidate.sdpMLineIndex;
      }
      signaling.postMessage(message);
    };
  }
  startConnection = async(client_id) => {
    await createPeerConnection(client_id);
    sendChannel[client_id] = pc[client_id].createDataChannel('sendDataChannel');
    sendChannel[client_id].onopen = onSendChannelStateChange;
    sendChannel[client_id].onmessage = onSendChannelMessageCallback;
    sendChannel[client_id].onclose = onSendChannelStateChange;
    const offer = await pc[client_id].createOffer();
    signaling.postMessage({type: 'offer', sdp: offer.sdp});
    await pc[client_id].setLocalDescription(offer);
  }


   



  async function handleAnswer(answer) {
    if (!pc[answer.id]) {
      return;
    }
    await pc[answer.id].setRemoteDescription(answer);
  }

  async function handleCandidate(candidate) {
    if (!pc[candidate.id]) {
      return;
    }
    if (!candidate.candidate) {
      await pc[candidate.id].addIceCandidate(null);
    } else {
      await pc[candidate.id].addIceCandidate(candidate);
    }
  }
  let sendImagesInterval = null;

  function sendData() {
    const data = dataChannelSend.value;
    console.log(data)
    for(const id in sendChannel){
      sendChannel[id].send(JSON.stringify({message: data}));
    }
    console.log('Sent Data: ' + data);
    clearInterval(sendImagesInterval);
    sendImagesInterval = null;
  }

  let blobs = [];
  let image_to_send = 0
  function sendImagesData() {
    sendImagesInterval = setInterval(()=>{
      // let blob_to_send = blobs[getRandomInt(3)];
      let blob_to_send = blobs[image_to_send];
        for(const id in sendChannel){
          sendChannel[id].send(  JSON.stringify({image:blob_to_send})  )
        }
        image_to_send++
        if(image_to_send > 2){
          image_to_send = 0;
        }
    }, 1000/ 4);
  }

 
 


  function onSendChannelMessageCallback(event) {
    console.log('Received Message');
    dataChannelReceive.value = event.data;
  }

  function onSendChannelStateChange() {
    let is_open = false;
    for( const channel in sendChannel){
      if(sendChannel[channel].readyState === "open"){
        is_open = true;
      }else{
        delete sendChannel[channel];
      }
    }
    console.log('Send channel state is: ' + is_open?"Open":"Closed");
    if (is_open) {
      dataChannelSend.disabled = false;
      dataChannelSend.focus();
      sendButton.disabled = false;
      sendImages.disabled = false;
    } else {
      dataChannelSend.disabled = true;
      sendButton.disabled = true;
      sendImages.disabled = true;
    }
  }







  {
  
  
    function loadXHR(url) {
      return new Promise(function(resolve, reject) {
          try {
              var xhr = new XMLHttpRequest();
              xhr.open("GET", url);
              xhr.responseType = "blob";
              xhr.onerror = function() {reject("Network error.")};
              xhr.onload = function() {
                  if (xhr.status === 200) {resolve(xhr.response)}
                  else {reject("Loading error:" + xhr.statusText)}
              };
              xhr.send();
          }
          catch(err) {reject(err.message)}
      });
    }
    let images = ["./images/image1.jpg","./images/image2.jpg","./images/image3.jpg"];
    for(image_src of images){
      
      loadXHR(image_src).then((blob)=>{
        //Send as Blob
        blobs.push(blob.text())

        //Send as base64
        // const reader = new FileReader();
        // reader.readAsDataURL(blob);
        // reader.onloadend = function() {
        //   blobs.push(  reader.result )
        //   console.log('RESULT', reader.result)
        // }
      })


    }
    console


  }





}
