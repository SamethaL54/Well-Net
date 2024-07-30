import React from 'react'
import { Link } from 'react-router-dom'

const Sucess = () => {
  return (
    <div>
      <img className='payment-image' src='https://www.indiaesevakendra.in/wp-content/uploads/2020/08/Paymentsuccessful21.png' alt='payment-sucess' ></img>
      <Link className='home' to={"/appointments"}>Home</Link>
    </div>
  )
}

export default Sucess