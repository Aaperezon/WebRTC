
const dataChannelReceive = document.getElementById('received_message');
const dataChannelReceiveImage = document.getElementById('received_image');

let pc;
let receiveChannel;
const uniqueId = () => {
  const dateString = Date.now().toString(36);
  const randomness = Math.random().toString(36).substr(2);
  return dateString + randomness;
};
const signaling = new BroadcastChannel('webrtc');
signaling.id =  uniqueId();
console.log(`ID: ${signaling.id}`)
signaling.onmessage = e => {
  switch (e.data.type) {
    case 'offer':
      console.log("OFFER")
      handleOffer(e.data);
      break;
    case 'answer':
      console.log("ANSWER")
      handleAnswer(e.data);
      break;
    case 'candidate':
      console.log("CANDIDATE")
      handleCandidate(e.data);
      break;
    default:
      console.log('unhandled', e);
      break;
  }
};
signaling.postMessage({type: 'ready', id: signaling.id});





function createPeerConnection() {
  pc = new RTCPeerConnection();
  console.log("CREATED NEW", signaling, "  |   ", signaling.id, "   |  ",pc)
  pc.onicecandidate = e => {
    const message = {
      type: 'candidate',
      candidate: null,
      id: signaling.id,
    };
    if (e.candidate) {
      message.candidate = e.candidate.candidate;
      message.sdpMid = e.candidate.sdpMid;
      message.sdpMLineIndex = e.candidate.sdpMLineIndex;
    }
    signaling.postMessage(message);
  };
}

async function handleOffer(offer) {
  if (pc) {
    // console.error('existing peerconnection');
    return;
  }
  await createPeerConnection();
  pc.ondatachannel = receiveChannelCallback;
  await pc.setRemoteDescription(offer);

  const answer = await pc.createAnswer();
  signaling.postMessage({type: 'answer', sdp: answer.sdp, id: signaling.id});
  await pc.setLocalDescription(answer);
}

async function handleAnswer(answer) {
  if (!pc) {
    // console.error('no peerconnection');
    return;
  }
  await pc.setRemoteDescription(answer);
}

async function handleCandidate(candidate) {
  if (!pc) {
    // console.error('no peerconnection');
    return;
  }
  if (!candidate.candidate) {
    await pc.addIceCandidate(null);
  } else {
    await pc.addIceCandidate(candidate);
  }
}


function receiveChannelCallback(event) {
  console.log('Receive Channel Callback');
  receiveChannel = event.channel;
  receiveChannel.onmessage = onReceiveChannelMessageCallback;
  receiveChannel.onopen = onReceiveChannelStateChange;
  receiveChannel.onclose = onReceiveChannelStateChange;
}

function onReceiveChannelMessageCallback(event) {
  console.log('Received Message');
  let received = JSON.parse(event.data);
  console.log(typeof(received), received)
  if("message" in received){
    dataChannelReceive.value = received.message;
  }else if("image" in received){
    // To get base64
    // dataChannelReceiveImage.src = received.image;

    // To Get BLOB
    const reader = new FileReader();
    reader.readAsDataURL(received.image);
    reader.onload = ()=> {
      dataChannelReceiveImage.src = reader.result;
    }
  } 
 



  console.log(typeof(event.data), event.data)
  if(typeof(event.data) == "string"){
    dataChannelReceive.value = event.data;
  
  }
  else if(typeof(event.data) == "object"){
   

  }
}


function onReceiveChannelStateChange() {
  const readyState = receiveChannel.readyState;
  console.log(`Receive channel state is: ${readyState}`);
  if(readyState === "closed"){
    pc.restartIce();
    
  }
  
}
