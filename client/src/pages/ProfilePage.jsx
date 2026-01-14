import React, { useContext, useState, useEffect } from 'react'
import assets from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import toast from 'react-hot-toast'

function ProfilePage() {

    const {authUser,updateProfile,deleteProfile}=useContext(AuthContext)
    const [selectedImg,setSelectedImg]=useState(null)
    const [showDeleteConfirmation,setShowDeleteConfirmation]=useState(false)
    const [isLoading, setIsLoading]=useState(false)
    const navigate=useNavigate()
    const [name,setName]=useState(authUser.fullName)
    const [bio,setBio]=useState(authUser.bio)




    const handleSubmit=async(e)=>{
        e.preventDefault()
        setIsLoading(true)
        if(!selectedImg){
            await updateProfile({fullName:name,bio});
            setIsLoading(false)
            navigate('/')
            return;
        }else{
            const reader=new FileReader();
            reader.readAsDataURL(selectedImg)
            reader.onload=async ()=>{
                const base64Image=reader.result;
                await updateProfile({profilePic:base64Image,fullName:name,bio})
                setIsLoading(false)
                navigate('/')
                return;
            }
        }
    }

    const handleDeleteProfile = async () => {
        const success = await deleteProfile();
        if (success) {
            navigate('/login');
        }
    }

    const confirmDelete = () => {
        setShowDeleteConfirmation(true);
    }


  return (
    <div className='min-h-screen bg-cover bg-no-repeat flex items-center justify-center'>
        <div className='w-5/6 max-w-2xl backdrop-blur-2xl text-gray-300 border-2 border-gray-600 flex items-center jutify-between max-sm:flex-col-reverse rounded-lg'>
            <form onSubmit={handleSubmit} className='flex flex-col gap-5 p-10 flex-1' action="">
                <h3 className='text-large'>Profile Details</h3>
                <label htmlFor="avatar" className='flex items-center gap-3 cursor-pointer'>
                    <input onChange={(e)=>setSelectedImg(e.target.files[0])} type="file" id='avatar' accept='.png, .jpg, .jpeg' hidden />
                    <img src={selectedImg ? URL.createObjectURL(selectedImg):authUser?.profilePic || assets.avatar_icon } alt="" className={`w-12 h-12 ${selectedImg && "rounded-full"} ${authUser.profilePic && "rounded-full"}`}/>
                    Upload Profile Image
                </label>
                <input onChange={(e)=>setName(e.target.value)} value={name} type="text" required placeholder='Your Name' className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500' />
                <textarea onChange={(e)=>setBio(e.target.value)} value={bio} name="" id="" required placeholder='Write profile bio..' className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500' rows={4}></textarea>

                <div className='flex flex-col gap-3'>
                    <button disabled={isLoading} className='bg-gradient-to-r from-purple-400 to-violet-600 text-white p-2 rounded-full text-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2' type='submit'>
                        {isLoading && (
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        )}
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                    
                    <button 
                        type='button'
                        onClick={confirmDelete}
                        className='bg-gradient-to-r from-red-500 to-red-600 text-white p-2 rounded-full text-lg cursor-pointer hover:from-red-600 hover:to-red-700 transition-all duration-200'
                    >
                        Delete Profile
                    </button>
                </div>
            </form>
            
            <img className={`max-w-44 aspect-square rounded-full mx-10 max-sm:mt-10 ${selectedImg && "rounded-full"}`} src={authUser.profilePic || assets.logo_icon} alt="" />
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirmation && (
            <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
                <div className='bg-white rounded-lg p-6 max-w-md mx-4 text-gray-800'>
                    <h3 className='text-xl font-bold mb-4 text-red-600'>Delete Profile</h3>
                    <p className='mb-6'>
                        Are you sure you want to delete your profile? This action cannot be undone and will permanently remove:
                    </p>
                    <ul className='mb-6 text-sm text-gray-600 list-disc list-inside'>
                        <li>Your account and profile information</li>
                        <li>All your messages and chat history</li>
                        <li>Your encryption keys</li>
                        <li>Any uploaded profile pictures</li>
                    </ul>
                    <div className='flex gap-4 justify-end'>
                        <button 
                            onClick={() => setShowDeleteConfirmation(false)}
                            className='px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors'
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleDeleteProfile}
                            className='px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors'
                        >
                            Delete Forever
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  )
}

export default ProfilePage
