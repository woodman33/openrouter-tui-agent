openapi: 3.0.3
info:
  title: Openverse API
  version: 909aa41ddf2115a69a447198b3f49121481e0c6b (v1)
  x-logo:
    url: https://raw.githubusercontent.com/WordPress/openverse/HEAD/documentation/meta/brand/logo.svg
    backgroundColor: '#fafafa'
  description: |2

    Openverse is a search engine for openly-licensed media. The Openverse
    API is a system that allows programmatic access to public domain digital
    media. It is our ambition to index and catalog billions of
    openly-licensed works, including articles, songs, videos, photographs,
    paintings, and more.

    Using this API, developers will be able to access the digital commons in
    their own applications. You can see some examples of
    [apps built with Openverse](https://docs.openverse.org/api/reference/made_with_ov.html)
    in our docs.
  termsOfService: https://docs.openverse.org/terms_of_service.html
  contact:
    name: Openverse
    email: openverse@wordpress.org
  license:
    name: MIT License
    url: https://github.com/WordPress/openverse/blob/main/LICENSE
paths:
  /v1/audio/:
    get:
      operationId: audio_search
      description: |2

        Return audio files that match the query.

        This endpoint allows you to search within specific fields, or to retrieve
        a collection of all audio files from a specific source, creator or tag.
        Results are paginated on the basis of the `page` parameter. The `page_size`
        parameter controls the total number of pages.

        Although there may be millions of relevant records, only the most relevant
        or the most recent several thousand records can be viewed. This is by design:
        the search endpoint should be used to find the top 10,000 most relevant
        results, not for exhaustive search or bulk download of every barely relevant
        result. As such, the caller should not try to access pages beyond `page_count`,
        or else the server will reject the query.

        ### Default search
        The **default search** allows users to find media based on a query string.
        It supports a wide range of optional filters to narrow down search results
        according to specific needs.

        By default, this endpoint performs a full-text search for the value of `q` parameter.
        You can search within the `creator`, `title` or `tags` fields by omitting
        the `q` parameter and using one of these field parameters.
        These results can be filtered by `source`, `excluded_source`, `license`, `license_type`, `creator`, `tags`, `title`, `filter_dead`, `extension`, `mature`, `unstable__include_sensitive_results`, `category` and `length`.

        The default search results are sorted by relevance.

        ### Collection search
        The collection search allows to retrieve a collection of media from a specific source,
        creator or tag. The `unstable__collection` parameter is used to specify the type of collection to retrieve.

        - `unstable__collection=tag&unstable__tag=tagName` will return the media with tag `tagName`.
        - `unstable__collection=source&source=sourceName` will return the media from source `sourceName`.
        - `unstable__collection=creator&creator=creatorName&source=sourceName` will return the media by creator `creatorName` at `sourceName`.

        Collection results are sorted by the time they were added to Openverse, with the most recent
        additions appearing first. The filters such as `license` are not available for collections.
      externalDocs:
        description: Openverse Syntax Guide
        url: https://openverse.org/search-help
      parameters:
      - in: query
        name: page
        schema:
          type: integer
          minimum: 1
          default: 1
        description: The page of results to retrieve. This parameter is subject to
          limitations based on authentication and access level. For details, refer
          to [the authentication documentation](#tag/auth).
      - in: query
        name: page_size
        schema:
          type: integer
          minimum: 1
          default: 20
        description: Number of results to return per page. This parameter is subject
          to limitations based on authentication and access level. For details, refer
          to [the authentication documentation](#tag/auth).
      - in: query
        name: q
        schema:
          type: string
          title: query
          minLength: 1
        description: A query string that should not exceed 200 characters in length
      - in: query
        name: source
        schema:
          type: string
          title: provider
          minLength: 1
        description: |2

          For default search, a comma separated list of data sources.
          When the `unstable__collection` parameter is used, this parameter only accepts a single source.

          Valid values are `source_name`s from the stats endpoint: https://api.openverse.org/v1/audio/stats/.
      - in: query
        name: excluded_source
        schema:
          type: string
          title: excluded_provider
          minLength: 1
        description: |2

          A comma separated list of data sources to exclude from the search.
          Valid values are `source_name`s from the stats endpoint: https://api.openverse.org/v1/audio/stats/.
      - in: query
        name: tags
        schema:
          type: string
          maxLength: 200
          minLength: 1
        description: Search by tag only. Cannot be used with `q`. The search is fuzzy,
          so `tags=cat` will match any value that includes the word `cat`. If the
          value contains space, items that contain any of the words in the value will
          match. To search for several values, join them with a comma.
      - in: query
        name: title
        schema:
          type: string
          maxLength: 200
          minLength: 1
        description: Search by title only. Cannot be used with `q`. The search is
          fuzzy, so `title=photo` will match any value that includes the word `photo`.
          If the value contains space, items that contain any of the words in the
          value will match. To search for several values, join them with a comma.
      - in: query
        name: creator
        schema:
          type: string
          maxLength: 200
          minLength: 1
        description: |2

          _When `q` parameter is present, `creator` parameter is ignored._

          **Creator collection**
          When used with `unstable__collection=creator&source=sourceName`, returns the collection of media
          by the specified creator. Notice that a single creator's media items
          can be found on several sources, but this collection only returns the
          items from the specified source.
          This is why for this collection, both the creator and the source
          parameters are required, and matched exactly. For a fuzzy creator search,
          use the default search without the `unstable__collection` parameter.

          **Creator search**
          When used without the `unstable__collection` parameter, will search in the creator field only.
          The search is fuzzy, so `creator=john` will match any value that includes the
          word `john`. If the value contains space, items that contain any of
          the words in the value will match. To search for several values,
          join them with a comma.
      - in: query
        name: unstable__collection
        schema:
          enum:
          - tag
          - source
          - creator
          type: string
          title: collection
          minLength: 1
        description: |2-




          _Caution: Parameters prefixed with `unstable__` are experimental and
          may change or be removed without notice in future updates. Use them
          with caution as they are not covered by our API versioning policy._



          The kind of media collection to return.

          Must be used with `unstable__tag`, `source` or `creator`+`source`

          * `tag` - tag
          * `source` - source
          * `creator` - creator
      - in: query
        name: unstable__tag
        schema:
          type: string
          title: tag
          maxLength: 200
          minLength: 1
        description: |2




          _Caution: Parameters prefixed with `unstable__` are experimental and
          may change or be removed without notice in future updates. Use them
          with caution as they are not covered by our API versioning policy._



          _Must be used with `unstable__collection=tag`_

          Get the collection of media with a specific tag. Returns the collection of media
          that has the specified tag, matching exactly and entirely.

          Differences that will cause tags to not match are:
          - upper and lower case letters
          - diacritical marks
          - hyphenation
          - spacing
          - multi-word tags where the query is only one of the words in the tag
          - multi-word tags where the words are in a different order.

          Examples of tags that **do not** match:
          - "Low-Quality" and "low-quality"
          - "jalapeño" and "jalapeno"
          - "Saint Pierre des Champs" and "Saint-Pierre-des-Champs"
          - "dog walking" and "dog  walking" (where the latter has two spaces between the
          last two words, as in a typographical error)
          - "runner" and "marathon runner"
          - "exclaiming loudly" and "loudly exclaiming"

          For non-exact or multi-tag matching, using the `tags` query parameter.
      - in: query
        name: license
        schema:
          type: string
          title: licenses
          minLength: 1
        description: 'A comma separated list of licenses; available licenses include:
          `by`, `by-nc`, `by-nc-nd`, `by-nc-sa`, `by-nd`, `by-sa`, `cc0`, `nc-sampling+`,
          `pdm`, and `sampling+`.'
      - in: query
        name: license_type
        schema:
          type: string
          minLength: 1
        description: 'A comma separated list of license types; available license types
          include: `all`, `all-cc`, `commercial`, and `modification`.'
      - in: query
        name: filter_dead
        schema:
          type: boolean
          default: true
        description: Control whether 404 links are filtered out.
      - in: query
        name: extension
        schema:
          type: string
          minLength: 1
        description: A comma separated list of desired file extensions.
      - in: query
        name: mature
        schema:
          type: boolean
          default: false
        description: Whether to include sensitive content.
      - in: query
        name: unstable__sort_by
        schema:
          enum:
          - relevance
          - indexed_on
          type: string
          default: relevance
          minLength: 1
        description: |2-



          _Caution: Parameters prefixed with `unstable__` are experimental and
          may change or be removed without notice in future updates. Use them
          with caution as they are not covered by our API versioning policy._


          The field which should be the basis for sorting results.

          * `relevance` - Relevance
          * `indexed_on` - Indexing date
      - in: query
        name: unstable__sort_dir
        schema:
          enum:
          - desc
          - asc
          type: string
          default: desc
          minLength: 1
        description: |2-



          _Caution: Parameters prefixed with `unstable__` are experimental and
          may change or be removed without notice in future updates. Use them
          with caution as they are not covered by our API versioning policy._


          The direction of sorting. Cannot be applied when sorting by `relevance`.

          * `desc` - Descending
          * `asc` - Ascending
      - in: query
        name: unstable__authority
        schema:
          type: boolean
          default: false
          title: authority
        description: |2-



          _Caution: Parameters prefixed with `unstable__` are experimental and
          may change or be removed without notice in future updates. Use them
          with caution as they are not covered by our API versioning policy._


          If enabled, the search will add a boost to results that are from authoritative sources.
      - in: query
        name: unstable__authority_boost
        schema:
          type: number
          format: double
          maximum: 10.0
          minimum: 0.0
          default: 1.0
          title: authority_boost
        description: |2-



          _Caution: Parameters prefixed with `unstable__` are experimental and
          may change or be removed without notice in future updates. Use them
          with caution as they are not covered by our API versioning policy._


          The boost coefficient to apply to authoritative sources, multiplied with the popularity boost.
      - in: query
        name: unstable__include_sensitive_results
        schema:
          type: boolean
          default: false
          title: include_sensitive_results
        description: |2-



          _Caution: Parameters prefixed with `unstable__` are experimental and
          may change or be removed without notice in future updates. Use them
          with caution as they are not covered by our API versioning policy._


          Whether to include results considered sensitive.
      - in: query
        name: category
        schema:
          type: string
          minLength: 1
        description: 'A comma separated list of categories; available categories include:
          `audiobook`, `music`, `news`, `podcast`, `pronunciation`, and `sound_effect`.'
      - in: query
        name: length
        schema:
          type: string
          minLength: 1
        description: 'A comma separated list of lengths; available lengths include:
          `long`, `medium`, `short`, and `shortest`.'
      - in: query
        name: peaks
        schema:
          type: boolean
          default: false
        description: Whether to include the waveform peaks or not
      tags:
      - audio
      security:
      - Openverse API Token: []
      - {}
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PaginatedAudioList'
              examples:
                OK:
                  value:
                    result_count: 10000
                    page_count: 20
                    page_size: 20
                    page: 1
                    results:
                    - id: 8624ba61-57f1-4f98-8a85-ece206c319cf
                      title: Wish You Were Here
                      indexed_on: '2022-12-06T06:54:25Z'
                      foreign_landing_url: https://www.jamendo.com/track/1214935
                      url: https://mp3d.jamendo.com/download/track/1214935/mp32
                      creator: The.madpix.project
                      creator_url: https://www.jamendo.com/artist/441585/the.madpix.project
                      license: by-nc-sa
                      license_version: '3.0'
                      license_url: https://creativecommons.org/licenses/by-nc-sa/3.0/
                      provider: jamendo
                      source: jamendo
                      category: music
                      genres:
                      - dance
                      - electronic
                      - house
                      filesize: 7139840
                      filetype: mp3
                      tags:
                      - accuracy: null
                        name: vocal
                        unstable__provider: jamendo
                      - accuracy: null
                        name: female
                        unstable__provider: jamendo
                      - accuracy: null
                        name: speed_medium
                        unstable__provider: jamendo
                      - accuracy: null
                        name: guitar
                        unstable__provider: jamendo
                      - accuracy: null
                        name: strings
                        unstable__provider: jamendo
                      - accuracy: null
                        name: energetic
                        unstable__provider: jamendo
                      - accuracy: null
                        name: acoustic
                        unstable__provider: jamendo
                      - accuracy: null
                        name: vocal
                        unstable__provider: jamendo