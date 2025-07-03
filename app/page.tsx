
import React from 'react'
import { UserButton } from '@clerk/nextjs'

import Fileupload from './Components/Fileupload'
import AuthGuard from './Components/AuthGuard'



const Home = async () => {




  return (
    <AuthGuard>
      <div className='flex items-center justify-between w-[100vw] p-6 border-primary '>
        <h1 className='text-2xl'>Doc <span className='text-primary'>Revive</span></h1>
        <UserButton />
      </div>
      <div className='flex flex-col items-center'>
        <h1 className='text-3xl text-center mt-10'>Welcome to DocRevive</h1>
        <p className='text-center mt-4'>Convert your documents with ease using DocRevive</p>
        <div className='mt-10'>
          <Fileupload></Fileupload>
        </div>
      </div>

    </AuthGuard>
  )
}

export default Home
