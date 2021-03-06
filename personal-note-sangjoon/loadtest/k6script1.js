//run with following command $ k6 run k6script1.js

import http from 'k6/http';
import { check, sleep } from 'k6';
export let options = {
  startVUs: 0,
  stages: [
  { duration: '60s', target: 500 },
  { duration: '60s', target: 0 },
  ],
};

const JSONparams = {
  headers: {
    'Content-Type': 'application/json',
  },
};

export default function () {

  signup(__VU)
  makepostroute()
  // getTree();

  sleep(1)
}

function getTree(){
    //sign up
    const payload = JSON.stringify({fandomId:1});

    let signup = http.post('http://localhost:3000/tree', payload, JSONparams);
    check(signup, { 'status was 200': (r) => r.status == 200 });
}

function makepostroute(){
  //log in page
  // let res = http.get('http://localhost:3000/app/login');
  // check(res, { 'status was 200': (r) => r.status == 200 });

  // signup(__VU)
  const token = login(__VU)

  // set cookie
  const jar = http.cookieJar();
  jar.set('https://localhost:3000', 'authToken', token);

  // make post
  const postid = makepost(__VU);

  // add chapter
  addchapter(__VU,postid,true)
}


function signup(__VU, shouldcheck=false) {
  const id = __VU;
  const email = id+"@test.com";
  const password = id+"";
  const name = id;

  //sign up
  const payload = JSON.stringify({email,password,name});

  let signup = http.post('http://localhost:3000/auth/signup', payload, JSONparams);
  if (shouldcheck) check(signup, { 'status was 200': (r) => r.status == 200 });
}

function login(__VU, shouldcheck=false) {
  const id = __VU;
  const email = id+"@test.com";
  const password = id+"";
  const name = id;

  //log in
  const payload = JSON.stringify({email,password});
  let signin = http.post('http://localhost:3000/auth/login', payload, JSONparams);
  if (shouldcheck) check(signin, { 'status was 200': (r) => r.status == 200 });

  //return cookie
  return signin.cookies.authToken[0].value
}

function makepost(__VU, shouldcheck=false){
  const fandom = 2

  const postpayload = JSON.stringify({
    "operationName": "MakeNewPost",
    "query":"mutation MakeNewPost($title: String!, $description: String!, $origin: Int!, $ancestor: Int!, $father: Int!, $fatherIndex: String!) {   makePost(input: {origin: $origin, title: $title, description: $description, ancestor: $ancestor, father: $father, fatherIndex: $fatherIndex}) {     id     title     __typename   } } ",
    "variables": {"title": "title from "+__VU, "description": "some description"+__VU, "origin": 1, "ancestor": fandom, "father": fandom, "fatherIndex": "1,1"}
  })
  let makepost = http.post('http://localhost:3000/graphql', postpayload, JSONparams);

  // console.log(JSON.stringify(makepost))

  if (shouldcheck) check(makepost, { 'status was 200': (r) => r.status == 200 });
  return JSON.parse(makepost.body).data.makePost.id
}

function addchapter(__VU,post_id, shouldcheck=false){
  const postpayload = JSON.stringify({
    "query": "mutation AddChapter($title: String!, $body: String!, $length: Int!, $originDirectFromFandom: Boolean!, $postOrFandomId: Int!) {   addChapter(input: {title: $title, length: $length, originDirectFromFandom: $originDirectFromFandom, postOrFandomId: $postOrFandomId, body: $body}) {     id     title     __typename   } } ",
    "variables": {"title": "some chapter title"+__VU, "originDirectFromFandom": false, "body": "some story with some content"+__VU, "postOrFandomId": post_id, "length": 1500}
  })
  let addchapter = http.post('http://localhost:3000/graphql', postpayload, JSONparams);

  if (shouldcheck) check(addchapter, { 'status was 200': (r) => r.status == 200 });
  // console.log(JSON.stringify(addchapter))
}