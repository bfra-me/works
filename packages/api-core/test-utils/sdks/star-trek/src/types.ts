import type {FromSchema} from '@bfra.me/api-core/types'
import type * as schemas from './schemas.js'

export type AnimalBase = FromSchema<typeof schemas.AnimalBase>
export type AnimalBaseResponse = FromSchema<typeof schemas.AnimalBaseResponse>
export type AnimalFull = FromSchema<typeof schemas.AnimalFull>
export type AnimalFullResponse = FromSchema<typeof schemas.AnimalFullResponse>
export type AstronomicalObjectBase = FromSchema<typeof schemas.AstronomicalObjectBase>
export type AstronomicalObjectBaseResponse = FromSchema<
  typeof schemas.AstronomicalObjectBaseResponse
>
export type AstronomicalObjectFull = FromSchema<typeof schemas.AstronomicalObjectFull>
export type AstronomicalObjectFullResponse = FromSchema<
  typeof schemas.AstronomicalObjectFullResponse
>
export type AstronomicalObjectHeader = FromSchema<typeof schemas.AstronomicalObjectHeader>
export type AstronomicalObjectType = FromSchema<typeof schemas.AstronomicalObjectType>
export type BloodType = FromSchema<typeof schemas.BloodType>
export type BookBase = FromSchema<typeof schemas.BookBase>
export type BookBaseResponse = FromSchema<typeof schemas.BookBaseResponse>
export type BookCollectionBase = FromSchema<typeof schemas.BookCollectionBase>
export type BookCollectionBaseResponse = FromSchema<typeof schemas.BookCollectionBaseResponse>
export type BookCollectionFull = FromSchema<typeof schemas.BookCollectionFull>
export type BookCollectionFullResponse = FromSchema<typeof schemas.BookCollectionFullResponse>
export type BookFull = FromSchema<typeof schemas.BookFull>
export type BookFullResponse = FromSchema<typeof schemas.BookFullResponse>
export type BookSeriesBase = FromSchema<typeof schemas.BookSeriesBase>
export type BookSeriesBaseResponse = FromSchema<typeof schemas.BookSeriesBaseResponse>
export type BookSeriesFull = FromSchema<typeof schemas.BookSeriesFull>
export type BookSeriesFullResponse = FromSchema<typeof schemas.BookSeriesFullResponse>
export type CharacterBase = FromSchema<typeof schemas.CharacterBase>
export type CharacterBaseResponse = FromSchema<typeof schemas.CharacterBaseResponse>
export type CharacterFull = FromSchema<typeof schemas.CharacterFull>
export type CharacterFullResponse = FromSchema<typeof schemas.CharacterFullResponse>
export type CharacterHeader = FromSchema<typeof schemas.CharacterHeader>
export type CharacterRelation = FromSchema<typeof schemas.CharacterRelation>
export type CharacterSpecies = FromSchema<typeof schemas.CharacterSpecies>
export type ComicCollectionBase = FromSchema<typeof schemas.ComicCollectionBase>
export type ComicCollectionBaseResponse = FromSchema<typeof schemas.ComicCollectionBaseResponse>
export type ComicCollectionFull = FromSchema<typeof schemas.ComicCollectionFull>
export type ComicCollectionFullResponse = FromSchema<typeof schemas.ComicCollectionFullResponse>
export type ComicSeriesBase = FromSchema<typeof schemas.ComicSeriesBase>
export type ComicSeriesBaseResponse = FromSchema<typeof schemas.ComicSeriesBaseResponse>
export type ComicSeriesFull = FromSchema<typeof schemas.ComicSeriesFull>
export type ComicSeriesFullResponse = FromSchema<typeof schemas.ComicSeriesFullResponse>
export type ComicStripBase = FromSchema<typeof schemas.ComicStripBase>
export type ComicStripBaseResponse = FromSchema<typeof schemas.ComicStripBaseResponse>
export type ComicStripFull = FromSchema<typeof schemas.ComicStripFull>
export type ComicStripFullResponse = FromSchema<typeof schemas.ComicStripFullResponse>
export type ComicsBase = FromSchema<typeof schemas.ComicsBase>
export type ComicsBaseResponse = FromSchema<typeof schemas.ComicsBaseResponse>
export type ComicsFull = FromSchema<typeof schemas.ComicsFull>
export type ComicsFullResponse = FromSchema<typeof schemas.ComicsFullResponse>
export type CompanyBase = FromSchema<typeof schemas.CompanyBase>
export type CompanyBaseResponse = FromSchema<typeof schemas.CompanyBaseResponse>
export type CompanyFull = FromSchema<typeof schemas.CompanyFull>
export type CompanyFullResponse = FromSchema<typeof schemas.CompanyFullResponse>
export type CompanyHeader = FromSchema<typeof schemas.CompanyHeader>
export type ConflictBase = FromSchema<typeof schemas.ConflictBase>
export type ConflictBaseResponse = FromSchema<typeof schemas.ConflictBaseResponse>
export type ConflictFull = FromSchema<typeof schemas.ConflictFull>
export type ConflictFullResponse = FromSchema<typeof schemas.ConflictFullResponse>
export type ContentLanguage = FromSchema<typeof schemas.ContentLanguage>
export type ContentRating = FromSchema<typeof schemas.ContentRating>
export type ContentRatingSystem = FromSchema<typeof schemas.ContentRatingSystem>
export type Country = FromSchema<typeof schemas.Country>
export type ElementBase = FromSchema<typeof schemas.ElementBase>
export type ElementBaseResponse = FromSchema<typeof schemas.ElementBaseResponse>
export type ElementFull = FromSchema<typeof schemas.ElementFull>
export type ElementFullResponse = FromSchema<typeof schemas.ElementFullResponse>
export type EpisodeBase = FromSchema<typeof schemas.EpisodeBase>
export type EpisodeBaseResponse = FromSchema<typeof schemas.EpisodeBaseResponse>
export type EpisodeFull = FromSchema<typeof schemas.EpisodeFull>
export type EpisodeFullResponse = FromSchema<typeof schemas.EpisodeFullResponse>
export type Error = FromSchema<typeof schemas.Error>
export type FoodBase = FromSchema<typeof schemas.FoodBase>
export type FoodBaseResponse = FromSchema<typeof schemas.FoodBaseResponse>
export type FoodFull = FromSchema<typeof schemas.FoodFull>
export type FoodFullResponse = FromSchema<typeof schemas.FoodFullResponse>
export type Gender = FromSchema<typeof schemas.Gender>
export type Genre = FromSchema<typeof schemas.Genre>
export type GetAnimalMetadataParam = FromSchema<typeof schemas.GetAnimal.metadata>
export type GetAnimalSearchMetadataParam = FromSchema<typeof schemas.GetAnimalSearch.metadata>
export type GetAstronomicalobjectMetadataParam = FromSchema<
  typeof schemas.GetAstronomicalobject.metadata
>
export type GetAstronomicalobjectSearchMetadataParam = FromSchema<
  typeof schemas.GetAstronomicalobjectSearch.metadata
>
export type GetBookMetadataParam = FromSchema<typeof schemas.GetBook.metadata>
export type GetBookSearchMetadataParam = FromSchema<typeof schemas.GetBookSearch.metadata>
export type GetBookcollectionMetadataParam = FromSchema<typeof schemas.GetBookcollection.metadata>
export type GetBookcollectionSearchMetadataParam = FromSchema<
  typeof schemas.GetBookcollectionSearch.metadata
>
export type GetBookseriesMetadataParam = FromSchema<typeof schemas.GetBookseries.metadata>
export type GetBookseriesSearchMetadataParam = FromSchema<
  typeof schemas.GetBookseriesSearch.metadata
>
export type GetCharacterMetadataParam = FromSchema<typeof schemas.GetCharacter.metadata>
export type GetCharacterSearchMetadataParam = FromSchema<typeof schemas.GetCharacterSearch.metadata>
export type GetComiccollectionMetadataParam = FromSchema<typeof schemas.GetComiccollection.metadata>
export type GetComiccollectionSearchMetadataParam = FromSchema<
  typeof schemas.GetComiccollectionSearch.metadata
>
export type GetComicsMetadataParam = FromSchema<typeof schemas.GetComics.metadata>
export type GetComicsSearchMetadataParam = FromSchema<typeof schemas.GetComicsSearch.metadata>
export type GetComicseriesMetadataParam = FromSchema<typeof schemas.GetComicseries.metadata>
export type GetComicseriesSearchMetadataParam = FromSchema<
  typeof schemas.GetComicseriesSearch.metadata
>
export type GetComicstripMetadataParam = FromSchema<typeof schemas.GetComicstrip.metadata>
export type GetComicstripSearchMetadataParam = FromSchema<
  typeof schemas.GetComicstripSearch.metadata
>
export type GetCompanyMetadataParam = FromSchema<typeof schemas.GetCompany.metadata>
export type GetCompanySearchMetadataParam = FromSchema<typeof schemas.GetCompanySearch.metadata>
export type GetConflictMetadataParam = FromSchema<typeof schemas.GetConflict.metadata>
export type GetConflictSearchMetadataParam = FromSchema<typeof schemas.GetConflictSearch.metadata>
export type GetElementMetadataParam = FromSchema<typeof schemas.GetElement.metadata>
export type GetElementSearchMetadataParam = FromSchema<typeof schemas.GetElementSearch.metadata>
export type GetEpisodeMetadataParam = FromSchema<typeof schemas.GetEpisode.metadata>
export type GetEpisodeSearchMetadataParam = FromSchema<typeof schemas.GetEpisodeSearch.metadata>
export type GetFoodMetadataParam = FromSchema<typeof schemas.GetFood.metadata>
export type GetFoodSearchMetadataParam = FromSchema<typeof schemas.GetFoodSearch.metadata>
export type GetLiteratureMetadataParam = FromSchema<typeof schemas.GetLiterature.metadata>
export type GetLiteratureSearchMetadataParam = FromSchema<
  typeof schemas.GetLiteratureSearch.metadata
>
export type GetLocationMetadataParam = FromSchema<typeof schemas.GetLocation.metadata>
export type GetLocationSearchMetadataParam = FromSchema<typeof schemas.GetLocationSearch.metadata>
export type GetMagazineMetadataParam = FromSchema<typeof schemas.GetMagazine.metadata>
export type GetMagazineSearchMetadataParam = FromSchema<typeof schemas.GetMagazineSearch.metadata>
export type GetMagazineseriesMetadataParam = FromSchema<typeof schemas.GetMagazineseries.metadata>
export type GetMagazineseriesSearchMetadataParam = FromSchema<
  typeof schemas.GetMagazineseriesSearch.metadata
>
export type GetMaterialMetadataParam = FromSchema<typeof schemas.GetMaterial.metadata>
export type GetMaterialSearchMetadataParam = FromSchema<typeof schemas.GetMaterialSearch.metadata>
export type GetMedicalconditionMetadataParam = FromSchema<
  typeof schemas.GetMedicalcondition.metadata
>
export type GetMedicalconditionSearchMetadataParam = FromSchema<
  typeof schemas.GetMedicalconditionSearch.metadata
>
export type GetMovieMetadataParam = FromSchema<typeof schemas.GetMovie.metadata>
export type GetMovieSearchMetadataParam = FromSchema<typeof schemas.GetMovieSearch.metadata>
export type GetOccupationMetadataParam = FromSchema<typeof schemas.GetOccupation.metadata>
export type GetOccupationSearchMetadataParam = FromSchema<
  typeof schemas.GetOccupationSearch.metadata
>
export type GetOrganizationMetadataParam = FromSchema<typeof schemas.GetOrganization.metadata>
export type GetOrganizationSearchMetadataParam = FromSchema<
  typeof schemas.GetOrganizationSearch.metadata
>
export type GetPerformerMetadataParam = FromSchema<typeof schemas.GetPerformer.metadata>
export type GetPerformerSearchMetadataParam = FromSchema<typeof schemas.GetPerformerSearch.metadata>
export type GetSeasonMetadataParam = FromSchema<typeof schemas.GetSeason.metadata>
export type GetSeasonSearchMetadataParam = FromSchema<typeof schemas.GetSeasonSearch.metadata>
export type GetSeriesMetadataParam = FromSchema<typeof schemas.GetSeries.metadata>
export type GetSeriesSearchMetadataParam = FromSchema<typeof schemas.GetSeriesSearch.metadata>
export type GetSoundtrackMetadataParam = FromSchema<typeof schemas.GetSoundtrack.metadata>
export type GetSoundtrackSearchMetadataParam = FromSchema<
  typeof schemas.GetSoundtrackSearch.metadata
>
export type GetSpacecraftMetadataParam = FromSchema<typeof schemas.GetSpacecraft.metadata>
export type GetSpacecraftSearchMetadataParam = FromSchema<
  typeof schemas.GetSpacecraftSearch.metadata
>
export type GetSpacecraftclassMetadataParam = FromSchema<typeof schemas.GetSpacecraftclass.metadata>
export type GetSpacecraftclassSearchMetadataParam = FromSchema<
  typeof schemas.GetSpacecraftclassSearch.metadata
>
export type GetSpeciesMetadataParam = FromSchema<typeof schemas.GetSpecies.metadata>
export type GetSpeciesSearchMetadataParam = FromSchema<typeof schemas.GetSpeciesSearch.metadata>
export type GetStaffMetadataParam = FromSchema<typeof schemas.GetStaff.metadata>
export type GetStaffSearchMetadataParam = FromSchema<typeof schemas.GetStaffSearch.metadata>
export type GetTechnologyMetadataParam = FromSchema<typeof schemas.GetTechnology.metadata>
export type GetTechnologySearchMetadataParam = FromSchema<
  typeof schemas.GetTechnologySearch.metadata
>
export type GetTitleMetadataParam = FromSchema<typeof schemas.GetTitle.metadata>
export type GetTitleSearchMetadataParam = FromSchema<typeof schemas.GetTitleSearch.metadata>
export type GetTradingcardMetadataParam = FromSchema<typeof schemas.GetTradingcard.metadata>
export type GetTradingcardSearchMetadataParam = FromSchema<
  typeof schemas.GetTradingcardSearch.metadata
>
export type GetTradingcarddeckMetadataParam = FromSchema<typeof schemas.GetTradingcarddeck.metadata>
export type GetTradingcarddeckSearchMetadataParam = FromSchema<
  typeof schemas.GetTradingcarddeckSearch.metadata
>
export type GetTradingcardsetMetadataParam = FromSchema<typeof schemas.GetTradingcardset.metadata>
export type GetTradingcardsetSearchMetadataParam = FromSchema<
  typeof schemas.GetTradingcardsetSearch.metadata
>
export type GetVideogameMetadataParam = FromSchema<typeof schemas.GetVideogame.metadata>
export type GetVideogameSearchMetadataParam = FromSchema<typeof schemas.GetVideogameSearch.metadata>
export type GetVideoreleaseMetadataParam = FromSchema<typeof schemas.GetVideorelease.metadata>
export type GetVideoreleaseSearchMetadataParam = FromSchema<
  typeof schemas.GetVideoreleaseSearch.metadata
>
export type GetWeaponMetadataParam = FromSchema<typeof schemas.GetWeapon.metadata>
export type GetWeaponSearchMetadataParam = FromSchema<typeof schemas.GetWeaponSearch.metadata>
export type LiteratureBase = FromSchema<typeof schemas.LiteratureBase>
export type LiteratureBaseResponse = FromSchema<typeof schemas.LiteratureBaseResponse>
export type LiteratureFull = FromSchema<typeof schemas.LiteratureFull>
export type LiteratureFullResponse = FromSchema<typeof schemas.LiteratureFullResponse>
export type LocationBase = FromSchema<typeof schemas.LocationBase>
export type LocationBaseResponse = FromSchema<typeof schemas.LocationBaseResponse>
export type LocationFull = FromSchema<typeof schemas.LocationFull>
export type LocationFullResponse = FromSchema<typeof schemas.LocationFullResponse>
export type MagazineBase = FromSchema<typeof schemas.MagazineBase>
export type MagazineBaseResponse = FromSchema<typeof schemas.MagazineBaseResponse>
export type MagazineFull = FromSchema<typeof schemas.MagazineFull>
export type MagazineFullResponse = FromSchema<typeof schemas.MagazineFullResponse>
export type MagazineSeriesBase = FromSchema<typeof schemas.MagazineSeriesBase>
export type MagazineSeriesBaseResponse = FromSchema<typeof schemas.MagazineSeriesBaseResponse>
export type MagazineSeriesFull = FromSchema<typeof schemas.MagazineSeriesFull>
export type MagazineSeriesFullResponse = FromSchema<typeof schemas.MagazineSeriesFullResponse>
export type MaritalStatus = FromSchema<typeof schemas.MaritalStatus>
export type MaterialBase = FromSchema<typeof schemas.MaterialBase>
export type MaterialBaseResponse = FromSchema<typeof schemas.MaterialBaseResponse>
export type MaterialFull = FromSchema<typeof schemas.MaterialFull>
export type MaterialFullResponse = FromSchema<typeof schemas.MaterialFullResponse>
export type MedicalConditionBase = FromSchema<typeof schemas.MedicalConditionBase>
export type MedicalConditionBaseResponse = FromSchema<typeof schemas.MedicalConditionBaseResponse>
export type MedicalConditionFull = FromSchema<typeof schemas.MedicalConditionFull>
export type MedicalConditionFullResponse = FromSchema<typeof schemas.MedicalConditionFullResponse>
export type MovieBase = FromSchema<typeof schemas.MovieBase>
export type MovieBaseResponse = FromSchema<typeof schemas.MovieBaseResponse>
export type MovieFull = FromSchema<typeof schemas.MovieFull>
export type MovieFullResponse = FromSchema<typeof schemas.MovieFullResponse>
export type OccupationBase = FromSchema<typeof schemas.OccupationBase>
export type OccupationBaseResponse = FromSchema<typeof schemas.OccupationBaseResponse>
export type OccupationFull = FromSchema<typeof schemas.OccupationFull>
export type OccupationFullResponse = FromSchema<typeof schemas.OccupationFullResponse>
export type OrganizationBase = FromSchema<typeof schemas.OrganizationBase>
export type OrganizationBaseResponse = FromSchema<typeof schemas.OrganizationBaseResponse>
export type OrganizationFull = FromSchema<typeof schemas.OrganizationFull>
export type OrganizationFullResponse = FromSchema<typeof schemas.OrganizationFullResponse>
export type OrganizationHeader = FromSchema<typeof schemas.OrganizationHeader>
export type PerformerBase = FromSchema<typeof schemas.PerformerBase>
export type PerformerBaseResponse = FromSchema<typeof schemas.PerformerBaseResponse>
export type PerformerFull = FromSchema<typeof schemas.PerformerFull>
export type PerformerFullResponse = FromSchema<typeof schemas.PerformerFullResponse>
export type Platform = FromSchema<typeof schemas.Platform>
export type PostAnimalSearchFormDataParam = FromSchema<typeof schemas.PostAnimalSearch.formData>
export type PostAnimalSearchMetadataParam = FromSchema<typeof schemas.PostAnimalSearch.metadata>
export type PostAstronomicalobjectSearchFormDataParam = FromSchema<
  typeof schemas.PostAstronomicalobjectSearch.formData
>
export type PostAstronomicalobjectSearchMetadataParam = FromSchema<
  typeof schemas.PostAstronomicalobjectSearch.metadata
>
export type PostBookSearchFormDataParam = FromSchema<typeof schemas.PostBookSearch.formData>
export type PostBookSearchMetadataParam = FromSchema<typeof schemas.PostBookSearch.metadata>
export type PostBookcollectionSearchFormDataParam = FromSchema<
  typeof schemas.PostBookcollectionSearch.formData
>
export type PostBookcollectionSearchMetadataParam = FromSchema<
  typeof schemas.PostBookcollectionSearch.metadata
>
export type PostBookseriesSearchFormDataParam = FromSchema<
  typeof schemas.PostBookseriesSearch.formData
>
export type PostBookseriesSearchMetadataParam = FromSchema<
  typeof schemas.PostBookseriesSearch.metadata
>
export type PostCharacterSearchFormDataParam = FromSchema<
  typeof schemas.PostCharacterSearch.formData
>
export type PostCharacterSearchMetadataParam = FromSchema<
  typeof schemas.PostCharacterSearch.metadata
>
export type PostComiccollectionSearchFormDataParam = FromSchema<
  typeof schemas.PostComiccollectionSearch.formData
>
export type PostComiccollectionSearchMetadataParam = FromSchema<
  typeof schemas.PostComiccollectionSearch.metadata
>
export type PostComicsSearchFormDataParam = FromSchema<typeof schemas.PostComicsSearch.formData>
export type PostComicsSearchMetadataParam = FromSchema<typeof schemas.PostComicsSearch.metadata>
export type PostComicseriesSearchFormDataParam = FromSchema<
  typeof schemas.PostComicseriesSearch.formData
>
export type PostComicseriesSearchMetadataParam = FromSchema<
  typeof schemas.PostComicseriesSearch.metadata
>
export type PostComicstripSearchFormDataParam = FromSchema<
  typeof schemas.PostComicstripSearch.formData
>
export type PostComicstripSearchMetadataParam = FromSchema<
  typeof schemas.PostComicstripSearch.metadata
>
export type PostCompanySearchFormDataParam = FromSchema<typeof schemas.PostCompanySearch.formData>
export type PostCompanySearchMetadataParam = FromSchema<typeof schemas.PostCompanySearch.metadata>
export type PostConflictSearchFormDataParam = FromSchema<typeof schemas.PostConflictSearch.formData>
export type PostConflictSearchMetadataParam = FromSchema<typeof schemas.PostConflictSearch.metadata>
export type PostElementSearchFormDataParam = FromSchema<typeof schemas.PostElementSearch.formData>
export type PostElementSearchMetadataParam = FromSchema<typeof schemas.PostElementSearch.metadata>
export type PostEpisodeSearchFormDataParam = FromSchema<typeof schemas.PostEpisodeSearch.formData>
export type PostEpisodeSearchMetadataParam = FromSchema<typeof schemas.PostEpisodeSearch.metadata>
export type PostFoodSearchFormDataParam = FromSchema<typeof schemas.PostFoodSearch.formData>
export type PostFoodSearchMetadataParam = FromSchema<typeof schemas.PostFoodSearch.metadata>
export type PostLiteratureSearchFormDataParam = FromSchema<
  typeof schemas.PostLiteratureSearch.formData
>
export type PostLiteratureSearchMetadataParam = FromSchema<
  typeof schemas.PostLiteratureSearch.metadata
>
export type PostLocationSearchFormDataParam = FromSchema<typeof schemas.PostLocationSearch.formData>
export type PostLocationSearchMetadataParam = FromSchema<typeof schemas.PostLocationSearch.metadata>
export type PostMagazineSearchFormDataParam = FromSchema<typeof schemas.PostMagazineSearch.formData>
export type PostMagazineSearchMetadataParam = FromSchema<typeof schemas.PostMagazineSearch.metadata>
export type PostMagazineseriesSearchFormDataParam = FromSchema<
  typeof schemas.PostMagazineseriesSearch.formData
>
export type PostMagazineseriesSearchMetadataParam = FromSchema<
  typeof schemas.PostMagazineseriesSearch.metadata
>
export type PostMaterialSearchFormDataParam = FromSchema<typeof schemas.PostMaterialSearch.formData>
export type PostMaterialSearchMetadataParam = FromSchema<typeof schemas.PostMaterialSearch.metadata>
export type PostMedicalconditionSearchFormDataParam = FromSchema<
  typeof schemas.PostMedicalconditionSearch.formData
>
export type PostMedicalconditionSearchMetadataParam = FromSchema<
  typeof schemas.PostMedicalconditionSearch.metadata
>
export type PostMovieSearchFormDataParam = FromSchema<typeof schemas.PostMovieSearch.formData>
export type PostMovieSearchMetadataParam = FromSchema<typeof schemas.PostMovieSearch.metadata>
export type PostOccupationSearchFormDataParam = FromSchema<
  typeof schemas.PostOccupationSearch.formData
>
export type PostOccupationSearchMetadataParam = FromSchema<
  typeof schemas.PostOccupationSearch.metadata
>
export type PostOrganizationSearchFormDataParam = FromSchema<
  typeof schemas.PostOrganizationSearch.formData
>
export type PostOrganizationSearchMetadataParam = FromSchema<
  typeof schemas.PostOrganizationSearch.metadata
>
export type PostPerformerSearchFormDataParam = FromSchema<
  typeof schemas.PostPerformerSearch.formData
>
export type PostPerformerSearchMetadataParam = FromSchema<
  typeof schemas.PostPerformerSearch.metadata
>
export type PostSeasonSearchFormDataParam = FromSchema<typeof schemas.PostSeasonSearch.formData>
export type PostSeasonSearchMetadataParam = FromSchema<typeof schemas.PostSeasonSearch.metadata>
export type PostSeriesSearchFormDataParam = FromSchema<typeof schemas.PostSeriesSearch.formData>
export type PostSeriesSearchMetadataParam = FromSchema<typeof schemas.PostSeriesSearch.metadata>
export type PostSoundtrackSearchFormDataParam = FromSchema<
  typeof schemas.PostSoundtrackSearch.formData
>
export type PostSoundtrackSearchMetadataParam = FromSchema<
  typeof schemas.PostSoundtrackSearch.metadata
>
export type PostSpacecraftSearchFormDataParam = FromSchema<
  typeof schemas.PostSpacecraftSearch.formData
>
export type PostSpacecraftSearchMetadataParam = FromSchema<
  typeof schemas.PostSpacecraftSearch.metadata
>
export type PostSpacecraftclassSearchFormDataParam = FromSchema<
  typeof schemas.PostSpacecraftclassSearch.formData
>
export type PostSpacecraftclassSearchMetadataParam = FromSchema<
  typeof schemas.PostSpacecraftclassSearch.metadata
>
export type PostSpeciesSearchFormDataParam = FromSchema<typeof schemas.PostSpeciesSearch.formData>
export type PostSpeciesSearchMetadataParam = FromSchema<typeof schemas.PostSpeciesSearch.metadata>
export type PostStaffSearchFormDataParam = FromSchema<typeof schemas.PostStaffSearch.formData>
export type PostStaffSearchMetadataParam = FromSchema<typeof schemas.PostStaffSearch.metadata>
export type PostTechnologySearchFormDataParam = FromSchema<
  typeof schemas.PostTechnologySearch.formData
>
export type PostTechnologySearchMetadataParam = FromSchema<
  typeof schemas.PostTechnologySearch.metadata
>
export type PostTitleSearchFormDataParam = FromSchema<typeof schemas.PostTitleSearch.formData>
export type PostTitleSearchMetadataParam = FromSchema<typeof schemas.PostTitleSearch.metadata>
export type PostTradingcardSearchFormDataParam = FromSchema<
  typeof schemas.PostTradingcardSearch.formData
>
export type PostTradingcardSearchMetadataParam = FromSchema<
  typeof schemas.PostTradingcardSearch.metadata
>
export type PostTradingcarddeckSearchFormDataParam = FromSchema<
  typeof schemas.PostTradingcarddeckSearch.formData
>
export type PostTradingcarddeckSearchMetadataParam = FromSchema<
  typeof schemas.PostTradingcarddeckSearch.metadata
>
export type PostTradingcardsetSearchFormDataParam = FromSchema<
  typeof schemas.PostTradingcardsetSearch.formData
>
export type PostTradingcardsetSearchMetadataParam = FromSchema<
  typeof schemas.PostTradingcardsetSearch.metadata
>
export type PostVideogameSearchFormDataParam = FromSchema<
  typeof schemas.PostVideogameSearch.formData
>
export type PostVideogameSearchMetadataParam = FromSchema<
  typeof schemas.PostVideogameSearch.metadata
>
export type PostVideoreleaseSearchFormDataParam = FromSchema<
  typeof schemas.PostVideoreleaseSearch.formData
>
export type PostVideoreleaseSearchMetadataParam = FromSchema<
  typeof schemas.PostVideoreleaseSearch.metadata
>
export type PostWeaponSearchFormDataParam = FromSchema<typeof schemas.PostWeaponSearch.formData>
export type PostWeaponSearchMetadataParam = FromSchema<typeof schemas.PostWeaponSearch.metadata>
export type ProductionRunUnit = FromSchema<typeof schemas.ProductionRunUnit>
export type Reference = FromSchema<typeof schemas.Reference>
export type ReferenceType = FromSchema<typeof schemas.ReferenceType>
export type ResponsePage = FromSchema<typeof schemas.ResponsePage>
export type ResponseSort = FromSchema<typeof schemas.ResponseSort>
export type ResponseSortClause = FromSchema<typeof schemas.ResponseSortClause>
export type ResponseSortDirection = FromSchema<typeof schemas.ResponseSortDirection>
export type SeasonBase = FromSchema<typeof schemas.SeasonBase>
export type SeasonBaseResponse = FromSchema<typeof schemas.SeasonBaseResponse>
export type SeasonFull = FromSchema<typeof schemas.SeasonFull>
export type SeasonFullResponse = FromSchema<typeof schemas.SeasonFullResponse>
export type SeasonHeader = FromSchema<typeof schemas.SeasonHeader>
export type SeriesBase = FromSchema<typeof schemas.SeriesBase>
export type SeriesBaseResponse = FromSchema<typeof schemas.SeriesBaseResponse>
export type SeriesFull = FromSchema<typeof schemas.SeriesFull>
export type SeriesFullResponse = FromSchema<typeof schemas.SeriesFullResponse>
export type SeriesHeader = FromSchema<typeof schemas.SeriesHeader>
export type SoundtrackBase = FromSchema<typeof schemas.SoundtrackBase>
export type SoundtrackBaseResponse = FromSchema<typeof schemas.SoundtrackBaseResponse>
export type SoundtrackFull = FromSchema<typeof schemas.SoundtrackFull>
export type SoundtrackFullResponse = FromSchema<typeof schemas.SoundtrackFullResponse>
export type SpacecraftBase = FromSchema<typeof schemas.SpacecraftBase>
export type SpacecraftBaseResponse = FromSchema<typeof schemas.SpacecraftBaseResponse>
export type SpacecraftClassBase = FromSchema<typeof schemas.SpacecraftClassBase>
export type SpacecraftClassBaseResponse = FromSchema<typeof schemas.SpacecraftClassBaseResponse>
export type SpacecraftClassFull = FromSchema<typeof schemas.SpacecraftClassFull>
export type SpacecraftClassFullResponse = FromSchema<typeof schemas.SpacecraftClassFullResponse>
export type SpacecraftClassHeader = FromSchema<typeof schemas.SpacecraftClassHeader>
export type SpacecraftFull = FromSchema<typeof schemas.SpacecraftFull>
export type SpacecraftFullResponse = FromSchema<typeof schemas.SpacecraftFullResponse>
export type SpacecraftType = FromSchema<typeof schemas.SpacecraftType>
export type SpeciesBase = FromSchema<typeof schemas.SpeciesBase>
export type SpeciesBaseResponse = FromSchema<typeof schemas.SpeciesBaseResponse>
export type SpeciesFull = FromSchema<typeof schemas.SpeciesFull>
export type SpeciesFullResponse = FromSchema<typeof schemas.SpeciesFullResponse>
export type SpeciesHeader = FromSchema<typeof schemas.SpeciesHeader>
export type StaffBase = FromSchema<typeof schemas.StaffBase>
export type StaffBaseResponse = FromSchema<typeof schemas.StaffBaseResponse>
export type StaffFull = FromSchema<typeof schemas.StaffFull>
export type StaffFullResponse = FromSchema<typeof schemas.StaffFullResponse>
export type StaffHeader = FromSchema<typeof schemas.StaffHeader>
export type TechnologyBase = FromSchema<typeof schemas.TechnologyBase>
export type TechnologyBaseResponse = FromSchema<typeof schemas.TechnologyBaseResponse>
export type TechnologyFull = FromSchema<typeof schemas.TechnologyFull>
export type TechnologyFullResponse = FromSchema<typeof schemas.TechnologyFullResponse>
export type TitleBase = FromSchema<typeof schemas.TitleBase>
export type TitleBaseResponse = FromSchema<typeof schemas.TitleBaseResponse>
export type TitleFull = FromSchema<typeof schemas.TitleFull>
export type TitleFullResponse = FromSchema<typeof schemas.TitleFullResponse>
export type TradingCardBase = FromSchema<typeof schemas.TradingCardBase>
export type TradingCardBaseResponse = FromSchema<typeof schemas.TradingCardBaseResponse>
export type TradingCardDeckBase = FromSchema<typeof schemas.TradingCardDeckBase>
export type TradingCardDeckBaseResponse = FromSchema<typeof schemas.TradingCardDeckBaseResponse>
export type TradingCardDeckFull = FromSchema<typeof schemas.TradingCardDeckFull>
export type TradingCardDeckFullResponse = FromSchema<typeof schemas.TradingCardDeckFullResponse>
export type TradingCardDeckHeader = FromSchema<typeof schemas.TradingCardDeckHeader>
export type TradingCardFull = FromSchema<typeof schemas.TradingCardFull>
export type TradingCardFullResponse = FromSchema<typeof schemas.TradingCardFullResponse>
export type TradingCardSetBase = FromSchema<typeof schemas.TradingCardSetBase>
export type TradingCardSetBaseResponse = FromSchema<typeof schemas.TradingCardSetBaseResponse>
export type TradingCardSetFull = FromSchema<typeof schemas.TradingCardSetFull>
export type TradingCardSetFullResponse = FromSchema<typeof schemas.TradingCardSetFullResponse>
export type TradingCardSetHeader = FromSchema<typeof schemas.TradingCardSetHeader>
export type VideoGameBase = FromSchema<typeof schemas.VideoGameBase>
export type VideoGameBaseResponse = FromSchema<typeof schemas.VideoGameBaseResponse>
export type VideoGameFull = FromSchema<typeof schemas.VideoGameFull>
export type VideoGameFullResponse = FromSchema<typeof schemas.VideoGameFullResponse>
export type VideoReleaseBase = FromSchema<typeof schemas.VideoReleaseBase>
export type VideoReleaseBaseResponse = FromSchema<typeof schemas.VideoReleaseBaseResponse>
export type VideoReleaseFormat = FromSchema<typeof schemas.VideoReleaseFormat>
export type VideoReleaseFull = FromSchema<typeof schemas.VideoReleaseFull>
export type VideoReleaseFullResponse = FromSchema<typeof schemas.VideoReleaseFullResponse>
export type WeaponBase = FromSchema<typeof schemas.WeaponBase>
export type WeaponBaseResponse = FromSchema<typeof schemas.WeaponBaseResponse>
export type WeaponFull = FromSchema<typeof schemas.WeaponFull>
export type WeaponFullResponse = FromSchema<typeof schemas.WeaponFullResponse>
