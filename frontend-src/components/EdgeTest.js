import React, { useEffect, useState } from "react"
import Axios from "axios"

function EdgeTest() {
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    document.title = "Edge Function Test | Our Amazing App"
  }, [])

  async function handleCallEdge() {
    setIsLoading(true)
    setError("")
    setResponse("")
    
    try {
      const result = await Axios.get("/test")
      setResponse(result.data)
    } catch (err) {
      setError(err.response?.data || err.message || "Failed to call edge function")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <h2 className="display-4">Edge Function Test</h2>
      <p className="lead">Test the edge function endpoint and see the response.</p>
      
      <button 
        onClick={handleCallEdge} 
        disabled={isLoading} 
        className="btn btn-primary mb-3"
      >
        {isLoading ? "Calling..." : "Call Edge Function"}
      </button>

      {response && (
        <div className="alert alert-success">
          <h5>Response:</h5>
          <pre>{typeof response === 'string' ? response : JSON.stringify(response, null, 2)}</pre>
        </div>
      )}

      {error && (
        <div className="alert alert-danger">
          <h5>Error:</h5>
          <pre>{error}</pre>
        </div>
      )}
    </div>
  )
}

export default EdgeTest