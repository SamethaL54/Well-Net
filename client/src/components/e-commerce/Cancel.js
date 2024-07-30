import React from 'react'
import { Link } from 'react-router-dom'

const Cancel = () => {
  return (
    <div>
      <img className='payment-image' src='https://mayoor.edunexttechnologies.com/images/payment_failure.png' alt='Payment failed' />
      <Link className='home' to={"/appointments"}>Home</Link>

    </div>
  )
}

export default Cancel
