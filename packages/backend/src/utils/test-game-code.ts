import { generateUniqueGameCode } from './gameCode'

async function testGameCode() {
  try {
    console.log('Testing game code generation...')
    
    // Generate 5 codes to verify uniqueness and format
    const codes = []
    for (let i = 0; i < 5; i++) {
      const code = await generateUniqueGameCode()
      codes.push(code)
      console.log(`Generated code ${i + 1}: ${code}`)
      
      // Verify code format
      if (code.length !== 6) {
        console.error(`❌ Invalid code length: ${code}`)
        return
      }
      if (!/^[A-Z0-9]+$/.test(code)) {
        console.error(`❌ Invalid characters in code: ${code}`)
        return
      }
    }
    
    // Check for duplicates
    const uniqueCodes = new Set(codes)
    if (uniqueCodes.size !== codes.length) {
      console.error('❌ Duplicate codes detected!')
      return
    }
    
    console.log('\n✅ All codes are valid and unique!')
    console.log('Format: 6 characters, A-Z and 0-9')
    console.log(`Generated codes: ${codes.join(', ')}`)
    
  } catch (error) {
    console.error('Error testing game codes:', error)
  }
}

testGameCode() 