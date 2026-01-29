import FuzzyText from '../blocks/TextAnimations/FuzzyText/FuzzyText'

export default function NoAutorizado() {
  return (
    <div className='flex flex-col items-center justify-center'>
      <FuzzyText color='#8b0836'>No</FuzzyText>
      <FuzzyText color='#000'>Autorizado</FuzzyText>
    </div>
  )
}
