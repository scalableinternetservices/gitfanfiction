
import { useMutation } from '@apollo/client';
import { RouteComponentProps } from '@reach/router';
import * as React from 'react';
import { SubmitButton } from '../component/Button';
import { ADDCOMMENT } from '../gql/mutation';
import { AppRouteParams } from '../nav/route';
interface HomePageProps extends RouteComponentProps, AppRouteParams { }

// eslint-disable-next-line @typescript-eslint/no-unused-vars


export function TestPage(props: HomePageProps) {

  const [id, setId] = React.useState("");
  const [body, setBody] = React.useState("");
  const [add_comment] = useMutation(ADDCOMMENT);

  let a = styles;
  a = a;


  return (
    <>
      <input type="text" value={id} onChange={(event) => setId(event.target.value)} />
      hello world
      <input type="text" value={body} onChange={(event) => setBody(event.target.value)} />
      <SubmitButton onClick={() => make_a_comment(add_comment, id, body)} />

    </>
  )
}

const make_a_comment = (add_comment: any, id: string, body: string) => {
  const n_id = parseInt(id);
  if (isNaN(n_id)) {
    alert("is not a valid story id")
    return;
  }

  alert("it worked")
  add_comment({
    variables: {
      story: n_id,
      body: body,
      time: ""
    }
  })
}


const styles = {
  root: {
    display: 'flex',
    justifyContent: 'top',
    color: '#000',
    backgroundImage: "url('/app/assets/image/webpage-general/background2.jpg')",
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
    minHeight: '100vh',
    position: 'relative',
  } as React.CSSProperties,

  branch: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -220%)',
  } as React.CSSProperties,

  searchbar: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    transform: 'translate(-50%, -150%)',
  } as React.CSSProperties,

  appbar: {
    backgroundColor: '202020',
    fontFamily: 'Consolas',
  },
  appbarWrapper: {
    width: '80%',
    margin: '15px auto',
  },
  appbarTitle: {
    color: '#fff',
    flex: '1',
    fontSize: '25',
    fontWeight: 'bold',
  } as React.CSSProperties,
  container: {
    textAlign: 'center',
  },
  icon: {
    color: '#fff',
    fontSize: '2rem',
  },
  iconDown: {
    color: '#000',
    fontSize: '4rem',
  },
  main_content: {
    height: "100vh"
  } as React.CSSProperties,
}



// import { gql, useMutation, useQuery } from '@apollo/client'
// import { RouteComponentProps } from '@reach/router'
// import * as React from 'react'
// import { style } from '../../../style/styled'
// import BranchDiagram from '../component/BranchDiagram'
// import SearchBar from '../component/SearchBar'
// import SearchBar2 from '../component/SearchBar2'
// import { AppRouteParams } from '../nav/route'

// interface HomePageProps extends RouteComponentProps, AppRouteParams { }


// // export const fetchBranch = gql`
// //   query getBranchContext {
// //     fandom(fandomId:1){
// //       id
// //       name
// //       length
// //     }
// //     getFandomPosts (fandomId:1){
// //       id
// //       upvote
// //       length
// //     }
// //   }
// // `

// export const fetchPost = gql`
// query fetchSomePost($postid: Int!) {
//   post(postId: $postid) {
//     id
//     title
//   }
// }
// `

// export const addchapter = gql`
// mutation pleaseadd($title:String!,$length:Int!,$originDirectFromFandom:Boolean!,$postOrFandomId:Int!,$body:String!) {
//   addChapter(input:{
//     title : $title
//     length : $length
//     originDirectFromFandom : $originDirectFromFandom
//     postOrFandomId : $postOrFandomId
//     body : $body
//   }) {
//     id
//     title
//     body
//   }
// }
// `


// // eslint-disable-next-line @typescript-eslint/no-unused-vars
// export function TestPage(props: HomePageProps) {

//   // const [error, setError] = React.useState("")
//   const [field, setField] = React.useState("")
//   const [fid, setFid] = React.useState(0)
//   const [pid, setPid] = React.useState(0)


//   const { loading, data } = useQuery(fetchPost, {
//     variables: { postid: 1 },
//   })

//   const [addTodo, cc] = useMutation(addchapter);

//   const sendform = () =>
//     addTodo({
//       variables: {
//         title: "kljsfjlasfjljlk",
//         length: 5,
//         originDirectFromFandom: false,
//         postOrFandomId: 2,
//         body: "lkjsdlfkjsd"
//       }
//     });

//   if (!loading) console.log(data)
//   console.log(cc.data)

//   // const fandomId = 1
//   // fetch('/tree', {
//   //   method: 'POST',
//   //   headers: { 'Content-Type': 'application/json' },
//   //   body: JSON.stringify({ fandomId }),
//   // })
//   //   .then(async res => {
//   //     if (res.status == 200) return res.text();
//   //     const err = await res.text()
//   //     throw err;
//   //   })
//   //   .then(setError)
//   //   .catch(err => {
//   //     setError(err.toString())
//   //   })

//   //-----
//   // const options = [
//   //   { value: 'chocolate', label: 'Chocolate' },
//   //   { value: 'strawberry', label: 'Strawberry' },
//   //   { value: 'vanilla', label: 'Vanilla' },
//   //   { value: 'vanilla', label: 'Vanilla' },
//   //   { value: 'vanilla', label: 'Vanilla' },
//   //   { value: 'vanilla', label: 'Vanilla' },
//   //   { value: 'vanilla', label: 'Vanilla' },
//   //   { value: 'vanilla', label: 'Vanilla' },
//   //   { value: 'vanilla', label: 'Vanilla' }
//   // ]


//   return (
//     <div>
//       <Header>
//         <div>
//           <div>{loading ? null : data.post.title}</div>
//           <a href="/app/post">post</a>
//         </div>
//         <div>
//           <a href="/app/setting">setting</a>
//         </div>
//         <div>
//           <a href="/app/login">login</a>
//         </div>
//         <div>
//           <a href="/app/request-fandom">request fandom</a>
//         </div>
//       </Header>
//       <div>type fandom id here {pid} </div>

//       <input value={field} onChange={(event) => {
//         const a = parseInt(event.target.value)
//         if (!isNaN(a)) setFid(a)
//         setField(event.target.value);
//         if (event.target.value == "send") sendform();
//       }} />
//       <SearchBar />
//       <SearchBar2 setFandomId={(i: any) => alert("fandomID " + i)} />
//       <BranchDiagram fandomId={fid} setPostId={setPid} />
//       {/* <Button variant="primary">WowWow</Button> */}

//       <div style={{ width: 100 }}>
//         {/* <Select
//           options={options}
//           menuColor='silver'
//           onChange={(opt: any) => console.log(opt.label, opt.value)}
//         /> */}

//       </div>

//     </div>
//   )
// }

// // const customStyles = {
// //   menu: (provided: any, state: any) => ({
// //     color: state.isSelected ? 'grey' : 'black',
// //   }),
// //   control: (base: any) => ({
// //     ...base,
// //     height: 35,
// //     minHeight: 35
// //   })
// //   // singleValue: (provided:any, state:any) => {
// //   //   const opacity = state.isDisabled ? 0.5 : 1;
// //   //   const transition = 'opacity 300ms';

// //   //   return { ...provided, opacity, transition };
// //   // }
// // }

// const Header = style('div', 'w-100', {
//   height: 100,
//   backgroundColor: '#8dc9bf',
//   alignItems: 'center'
// })