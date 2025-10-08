import React, { useContext, useEffect, useState } from 'react'
import assets, { imagesDummyData } from '../assets/assets'
import { ChatContext } from '../context/ChatContext'
import { AuthContext } from '../context/AuthContext'

function RightSideBar() {
     const {selectedUser,messages,deleteMessages}=useContext(ChatContext)

     const {logout,onlineUser}=useContext(AuthContext)

     const [msgImages,setMsgImages]=useState([])
    
    // get all the images from messages and set them to state
    useEffect(()=>{
        setMsgImages(
            messages.filter(msg=>msg.image).map(msg=>msg.image)
        )
    },[messages])

  return selectedUser && (
    <div className={`bg-[#8185B2]/10 text-white w-full relative overflow-y-scroll ${selectedUser ? "max-md:hidden":""}`}>
        <div className='flex flex-col pt-16 items-center justify-between text-xs font-light mx-auto'>
            <img src={selectedUser?.profilePic || assets.avatar_icon} alt="" className='w-20 aspect-[1/1] rounded-full' />
            <h1 className='px-10 text-xl font-medium mx-auto flex items-center gap-2'>
                {onlineUser.includes(selectedUser._id) && <p className='w-2 h-2 rounded-full bg-green-500'>
                    </p> }
                    {selectedUser.fullName}</h1>
                <p className='px-10 mx-auto'>
                    {selectedUser.bio}
                </p>

        </div>
        <div className='flex items-center justify-center mt-4 text-xs font-bold  '>
            <button onClick={deleteMessages}  className='p-2 rounded-lg bg-blue-700 hover:bg-red-600 
            cursor-pointer transition'>
                Delete Messages
            </button>
            </div>
        <hr className='border-[#ffffff50] my-4' />
        <div className='px-5 text-xs'>
            <p>Media</p>
            <div className='mt-2 max-h-[200px] overflow-y-scroll grid grid-cols-2 gap-4 opacity-80'>

                {msgImages.map((url,index)=>(
                    <div key={index} onClick={()=>window.open(url)} className='cursor-pointer rounded'>
                        <img src={url} alt="" className='h-full rounded-md'/>
                    </div>
                ))}
            </div>

        </div>

        <button onClick={()=>logout()} className='absolute bottom-5 left-1/2 transorm -translate-x-1/2 
        bg-gradient-to-r from-purple-400 to-violet-600 text-white border-none
        text-sm font-light py-2 px-20 rounded-full cursor-pointer'>
            Logout
        </button>
    </div>
  )
}

export default RightSideBar
